const fs = require('fs/promises');
const path = require('path');
const mongoose = require('mongoose');
const { Notification, NotificationRead, SchoolClass, Student, User } = require('../models');
const { isCloudinaryConfigured, uploadBufferToCloudinary } = require('../services/cloudinaryService');

function isPrincipal(user) {
  return String(user?.role || '') === 'Principal';
}

function enforcePrincipalSystemRestriction(user, category) {
  if (!isPrincipal(user)) return null;
  if (String(category || '').toLowerCase() === 'system') {
    return 'Principal cannot create or manage System notifications';
  }
  return null;
}

function toObjectId(value) {
  try {
    return new mongoose.Types.ObjectId(value);
  } catch {
    return null;
  }
}

async function resolveStudentForUser(user) {
  const profile = user?.profile || {};
  if (profile.studentRef) {
    const byRef = await Student.findById(profile.studentRef);
    if (byRef) return byRef;
  }
  if (profile.studentId) {
    const byStudentId = await Student.findOne({ studentId: String(profile.studentId) });
    if (byStudentId) return byStudentId;
  }
  if (typeof profile.studentRef === 'string') {
    const byStudentId = await Student.findOne({ studentId: String(profile.studentRef) });
    if (byStudentId) return byStudentId;
  }
  return null;
}

async function getClassLevelByName(cls) {
  if (!cls) return null;
  const doc = await SchoolClass.findOne({ name: String(cls) }).select('level').lean();
  return doc?.level || null;
}

function uniqStrings(values) {
  const out = [];
  const seen = new Set();
  for (const v of values || []) {
    const s = String(v || '').trim();
    if (!s) continue;
    const key = s.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(s);
  }
  return out;
}

async function normalizeAttachments(req) {
  const existing = Array.isArray(req.body?.attachments)
    ? req.body.attachments.filter(Boolean)
    : typeof req.body?.attachments === 'string'
      ? [req.body.attachments].filter(Boolean)
      : [];

  const files = Array.isArray(req.files) ? req.files : [];
  if (!files.length) return uniqStrings(existing);

  const uploaded = [];
  for (const file of files) {
    const uploadsDir = path.resolve(process.cwd(), 'uploads', 'notifications');
    const safeName = String(file.originalname || 'attachment').replace(/[^a-zA-Z0-9._-]/g, '_');

    if (isCloudinaryConfigured()) {
      try {
        // eslint-disable-next-line no-await-in-loop
        const result = await uploadBufferToCloudinary({
          buffer: file.buffer,
          folder: 'notifications',
          resourceType: 'auto',
          originalFilename: file.originalname
        });
        uploaded.push(result.secureUrl);
        continue;
      } catch {
        // Fall back to local storage if Cloudinary is misconfigured or unavailable.
      }
    }

    await fs.mkdir(uploadsDir, { recursive: true });
    const filename = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}-${safeName}`;
    const relativePath = path.posix.join('uploads', 'notifications', filename);
    const absolutePath = path.join(uploadsDir, filename);
    await fs.writeFile(absolutePath, file.buffer);
    uploaded.push(`/${relativePath}`);
  }

  return uniqStrings([...existing, ...uploaded]);
}

// Admin: create broadcast notifications
async function createBroadcast(req, res, next) {
  try {
    const {
      scope,
      category,
      title,
      body,
      roles,
      targetType,
      level,
      class: cls,
      section,
      studentId,
      userId,
      recipientRoles
    } = req.body;

    const principalRestrictionError = enforcePrincipalSystemRestriction(req.user, category);
    if (principalRestrictionError) {
      return res.status(403).json({ error: principalRestrictionError });
    }

    const attachments = await normalizeAttachments(req);

    const doc = {
      kind: 'broadcast',
      scope,
      category: category || 'normal',
      title,
      body: body || '',
      createdBy: req.user.id,
      expiresAt: req.body.expiresAt ? new Date(req.body.expiresAt) : undefined,
      attachments
    };

    if (scope === 'role') {
      doc.targetRoles = uniqStrings(roles);
      if (!doc.targetRoles.length) {
        return res.status(400).json({ error: 'roles are required for role notifications' });
      }
    }

    if (scope === 'targeted') {
      doc.targetRoles = uniqStrings(recipientRoles);

      if (targetType === 'level') {
        if (!level) return res.status(400).json({ error: 'level is required' });
        doc.targetLevels = [String(level)];
      } else if (targetType === 'class') {
        if (!cls) return res.status(400).json({ error: 'class is required' });
        doc.targetClass = String(cls);
      } else if (targetType === 'section') {
        if (!cls || !section) return res.status(400).json({ error: 'class and section are required' });
        doc.targetClass = String(cls);
        doc.targetSection = String(section);
      } else if (targetType === 'student') {
        const sid = toObjectId(studentId);
        if (!sid) return res.status(400).json({ error: 'studentId is required' });
        doc.targetStudents = [sid];
      } else if (targetType === 'user') {
        const uid = toObjectId(userId);
        if (!uid) return res.status(400).json({ error: 'userId is required' });
        doc.targetUsers = [uid];
      } else {
        return res.status(400).json({ error: 'targetType is required for targeted notifications' });
      }
    }

    const created = await Notification.create(doc);
    res.status(201).json({ notification: created });
  } catch (err) {
    next(err);
  }
}

async function deleteBroadcast(req, res, next) {
  try {
    const id = toObjectId(req.params.id);
    if (!id) return res.status(400).json({ error: 'Invalid notification id' });

    const n = await Notification.findById(id).select('_id kind category').lean();
    if (!n || n.kind !== 'broadcast') return res.status(404).json({ error: 'Not found' });

    const principalRestrictionError = enforcePrincipalSystemRestriction(req.user, n.category);
    if (principalRestrictionError) {
      return res.status(403).json({ error: principalRestrictionError });
    }

    await Notification.deleteOne({ _id: id });
    await NotificationRead.deleteMany({ notification: id });
    res.json({ ok: true });
  } catch (err) {
    next(err);
  }
}

async function listBroadcast(req, res, next) {
  try {
    const { scope, category, limit } = req.query;
    const filter = { kind: 'broadcast' };
    if (scope) filter.scope = scope;
    if (category) {
      const principalRestrictionError = enforcePrincipalSystemRestriction(req.user, category);
      if (principalRestrictionError) {
        return res.status(403).json({ error: principalRestrictionError });
      }
      filter.category = category;
    }

    if (isPrincipal(req.user) && !filter.category) {
      filter.category = { $ne: 'system' };
    }

    const list = await Notification.find(filter)
      .sort({ createdAt: -1 })
      .limit(parseInt(limit || '50', 10))
      .populate('createdBy', 'name email role')
      .lean();

    res.json({ notifications: list });
  } catch (err) {
    next(err);
  }
}

async function updateBroadcast(req, res, next) {
  try {
    const id = toObjectId(req.params.id);
    if (!id) return res.status(400).json({ error: 'Invalid notification id' });

    const existing = await Notification.findById(id).select('_id kind category').lean();
    if (!existing || existing.kind !== 'broadcast') return res.status(404).json({ error: 'Not found' });

    const existingRestrictionError = enforcePrincipalSystemRestriction(req.user, existing.category);
    if (existingRestrictionError) {
      return res.status(403).json({ error: existingRestrictionError });
    }

    const nextCategory = req.body?.category !== undefined ? req.body.category : existing.category;
    const payloadRestrictionError = enforcePrincipalSystemRestriction(req.user, nextCategory);
    if (payloadRestrictionError) {
      return res.status(403).json({ error: payloadRestrictionError });
    }

    const updates = {};
    if (req.body?.title !== undefined) updates.title = String(req.body.title || '').trim();
    if (req.body?.body !== undefined) updates.body = String(req.body.body || '');
    if (req.body?.category !== undefined) updates.category = String(req.body.category || '').trim();
    if (Object.prototype.hasOwnProperty.call(req.body || {}, 'expiresAt')) {
      updates.expiresAt = req.body.expiresAt ? new Date(req.body.expiresAt) : null;
    }
    if (Array.isArray(req.files) && req.files.length > 0) {
      updates.attachments = await normalizeAttachments(req);
    }

    const updated = await Notification.findByIdAndUpdate(id, updates, { new: true }).lean();
    return res.json({ notification: updated });
  } catch (err) {
    next(err);
  }
}

// Any user: create request
async function createRequest(req, res, next) {
  try {
    const { title, message, category } = req.body;
    const attachments = await normalizeAttachments(req);
    const created = await Notification.create({
      kind: 'request',
      category: category || 'pending',
      title,
      body: '',
      attachments,
      createdBy: req.user.id,
      requester: req.user.id,
      status: 'pending',
      thread: [
        {
          by: req.user.id,
          byRole: req.user.role,
          message
        }
      ]
    });

    res.status(201).json({ request: created });
  } catch (err) {
    next(err);
  }
}

// Admin/Principal: list requests
async function listRequests(req, res, next) {
  try {
    const { status, category, limit } = req.query;
    const filter = { kind: 'request' };
    if (status) filter.status = status;
    if (category) filter.category = category;

    const list = await Notification.find(filter)
      .sort({ updatedAt: -1 })
      .limit(parseInt(limit || '50', 10))
      .populate('requester', 'name email role')
      .lean();

    res.json({ requests: list });
  } catch (err) {
    next(err);
  }
}

// Admin/Principal: reply to request
async function replyRequest(req, res, next) {
  try {
    const request = await Notification.findById(req.params.id);
    if (!request || request.kind !== 'request') return res.status(404).json({ error: 'Not found' });

    if (request.status === 'closed') {
      return res.status(400).json({ error: 'Request is closed' });
    }

    request.thread.push({ by: req.user.id, byRole: req.user.role, message: req.body.message });
    request.status = 'replied';
    await request.save();

    await request.populate('requester', 'name email role');
    res.json({ request });
  } catch (err) {
    next(err);
  }
}

async function closeRequest(req, res, next) {
  try {
    const request = await Notification.findById(req.params.id);
    if (!request || request.kind !== 'request') return res.status(404).json({ error: 'Not found' });

    request.status = 'closed';
    await request.save();

    await request.populate('requester', 'name email role');
    res.json({ request });
  } catch (err) {
    next(err);
  }
}

async function markRead(req, res, next) {
  try {
    const id = toObjectId(req.params.id);
    if (!id) return res.status(400).json({ error: 'Invalid notification id' });

    const n = await Notification.findById(id).select('_id kind requester').lean();
    if (!n) return res.status(404).json({ error: 'Not found' });

    // Only requester can mark their request; broadcasts are visible per inbox rules.
    if (n.kind === 'request' && String(n.requester) !== String(req.user.id)) {
      return res.status(403).json({ error: 'Forbidden' });
    }

    await NotificationRead.updateOne(
      { notification: id, user: req.user.id },
      { $setOnInsert: { readAt: new Date() } },
      { upsert: true }
    );

    res.json({ ok: true });
  } catch (err) {
    // ignore duplicate key race
    if (err?.code === 11000) return res.json({ ok: true });
    next(err);
  }
}

async function dismiss(req, res, next) {
  try {
    const id = toObjectId(req.params.id);
    if (!id) return res.status(400).json({ error: 'Invalid notification id' });

    const n = await Notification.findById(id).select('_id kind').lean();
    if (!n) return res.status(404).json({ error: 'Not found' });
    if (n.kind !== 'broadcast') return res.status(400).json({ error: 'Only broadcasts can be dismissed' });

    await NotificationRead.updateOne(
      { notification: id, user: req.user.id },
      { $set: { dismissedAt: new Date() }, $setOnInsert: { readAt: new Date() } },
      { upsert: true }
    );

    res.json({ ok: true });
  } catch (err) {
    if (err?.code === 11000) return res.json({ ok: true });
    next(err);
  }
}

function matchesRoleBroadcast(notification, role) {
  if (notification.scope !== 'role') return false;
  if (!Array.isArray(notification.targetRoles)) return false;
  const needle = String(role || '').toLowerCase();
  return notification.targetRoles.some((r) => String(r || '').toLowerCase() === needle);
}

async function matchesTargeted(notification, user) {
  if (notification.scope !== 'targeted') return false;

  // Direct user targeting
  if (Array.isArray(notification.targetUsers) && notification.targetUsers.some((u) => String(u) === String(user.id))) {
    return true;
  }

  // By role
  if (Array.isArray(notification.targetRoles) && notification.targetRoles.length > 0) {
    if (!notification.targetRoles.includes(user.role)) return false;
  }

  if (user.role === 'Student') {
    const student = await resolveStudentForUser(user);
    if (!student) return false;

    if (Array.isArray(notification.targetStudents) && notification.targetStudents.some((s) => String(s) === String(student._id))) {
      return true;
    }

    if (notification.targetClass) {
      if (String(notification.targetClass) !== String(student.class)) return false;
      if (notification.targetSection && String(notification.targetSection) !== String(student.section)) return false;
      return true;
    }

    if (Array.isArray(notification.targetLevels) && notification.targetLevels.length > 0) {
      const lvl = await getClassLevelByName(student.class);
      return lvl ? notification.targetLevels.includes(lvl) : false;
    }

    return false;
  }

  if (user.role === 'Parent') {
    const children = await Student.find({ parents: user.id }).select('class section').lean();
    if (!children.length) return false;

    if (Array.isArray(notification.targetStudents) && notification.targetStudents.length > 0) {
      const ids = new Set(notification.targetStudents.map((x) => String(x)));
      const childDocs = await Student.find({ parents: user.id }).select('_id class section').lean();
      return childDocs.some((c) => ids.has(String(c._id)));
    }

    if (notification.targetClass) {
      return children.some((c) => {
        if (String(c.class) !== String(notification.targetClass)) return false;
        if (notification.targetSection && String(c.section) !== String(notification.targetSection)) return false;
        return true;
      });
    }

    if (Array.isArray(notification.targetLevels) && notification.targetLevels.length > 0) {
      // Resolve levels by class names
      const classNames = uniqStrings(children.map((c) => c.class));
      const classes = await SchoolClass.find({ name: { $in: classNames } }).select('name level').lean();
      const map = new Map(classes.map((c) => [String(c.name), c.level]));
      return children.some((c) => {
        const lvl = map.get(String(c.class));
        return lvl ? notification.targetLevels.includes(lvl) : false;
      });
    }

    return false;
  }

  // Other roles: only direct targeting or role broadcast
  return false;
}

// Any user: inbox
async function inbox(req, res, next) {
  try {
    const limit = parseInt(req.query.limit || '50', 10);
    const role = req.user.role;

    const now = new Date();

    const expiryFilter = {
      $or: [{ expiresAt: { $exists: false } }, { expiresAt: null }, { expiresAt: { $gt: now } }]
    };

    // Always include global + role broadcasts directly (so they can't be pushed out by targeted volume).
    const [globalList, roleList] = await Promise.all([
      Notification.find({ kind: 'broadcast', scope: 'global', ...expiryFilter }).sort({ createdAt: -1 }).limit(limit).lean(),
      Notification.find({ kind: 'broadcast', scope: 'role', targetRoles: role, ...expiryFilter })
        .sort({ createdAt: -1 })
        .limit(limit)
        .lean()
    ]);

    // Targeted broadcasts still require per-user matching.
    const candidates = await Notification.find({ kind: 'broadcast', scope: 'targeted', ...expiryFilter })
      .sort({ createdAt: -1 })
      .limit(Math.max(limit * 3, 100))
      .lean();

    const visible = [];
    const seen = new Set();
    const pushUnique = (n) => {
      const key = String(n?._id || '');
      if (!key || seen.has(key)) return;
      seen.add(key);
      visible.push(n);
    };

    for (const n of globalList) pushUnique(n);
    for (const n of roleList) pushUnique(n);
    for (const n of candidates) {
      // eslint-disable-next-line no-await-in-loop
      if (await matchesTargeted(n, req.user)) pushUnique(n);
      if (visible.length >= limit) break;
    }

    visible.sort((a, b) => new Date(b?.createdAt || 0) - new Date(a?.createdAt || 0));
    if (visible.length > limit) visible.length = limit;

    // Add own requests
    const myRequests = await Notification.find({ kind: 'request', requester: req.user.id })
      .sort({ updatedAt: -1 })
      .limit(20)
      .lean();

    const ids = [...visible, ...myRequests].map((x) => x._id);
    const reads = await NotificationRead.find({ user: req.user.id, notification: { $in: ids } })
      .select('notification readAt dismissedAt')
      .lean();
    const readSet = new Set(reads.map((r) => String(r.notification)));
    const dismissedSet = new Set(reads.filter((r) => r.dismissedAt).map((r) => String(r.notification)));

    const decorate = (n) => ({
      ...n,
      isRead: readSet.has(String(n._id)),
      isDismissed: dismissedSet.has(String(n._id))
    });

    res.json({
      notifications: visible.filter((n) => !dismissedSet.has(String(n._id))).map(decorate),
      requests: myRequests.map(decorate)
    });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  createBroadcast,
  listBroadcast,
  updateBroadcast,
  deleteBroadcast,
  createRequest,
  listRequests,
  getRequest: async function getRequest(req, res, next) {
    try {
      const request = await Notification.findById(req.params.id)
        .populate('requester', 'name email role')
        .populate('thread.by', 'name email role');
      if (!request || request.kind !== 'request') return res.status(404).json({ error: 'Not found' });

      const role = req.user.role;
      if (['Admin', 'Principal'].includes(role)) return res.json({ request });
      if (String(request.requester) !== String(req.user.id)) return res.status(403).json({ error: 'Forbidden' });
      return res.json({ request });
    } catch (err) {
      next(err);
    }
  },
  replyRequest,
  closeRequest,
  inbox,
  markRead,
  dismiss
};
