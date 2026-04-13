const mongoose = require('mongoose');
const {
  Transport,
  TransportRoute,
  TransportEnrollment,
  TransportPayment,
  TransportRequest,
  Student,
  Teacher,
  User
} = require('../models');
const {
  isManagerRole,
  canConfigureRoutes,
  canDeleteAsRole,
  normalizeStatus,
  parsePositiveInt,
  toObjectId,
  resolveTransportSubject
} = require('../services/transportService');

function escapeRegex(input) {
  return String(input || '').replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function isPrincipal(user) {
  return String(user?.role || '') === 'Principal';
}

function deniedDeleteForPrincipal(user) {
  return isPrincipal(user);
}

async function getParentStudentIds(parentUserId) {
  const rows = await Student.find({ parents: parentUserId }).select('_id user').lean();
  return rows;
}

function buildPagination(query) {
  const page = parsePositiveInt(query?.page, 1);
  const limit = Math.min(parsePositiveInt(query?.limit, 20), 100);
  const skip = (page - 1) * limit;
  return { page, limit, skip };
}

async function listRoutes(req, res, next) {
  try {
    const { q, active } = req.query;
    const { page, limit, skip } = buildPagination(req.query);

    const filter = {};
    if (active !== undefined) filter.active = String(active) === 'true';
    const search = String(q || '').trim();
    if (search) {
      const re = new RegExp(escapeRegex(search), 'i');
      filter.$or = [{ name: re }, { code: re }, { pickupPoint: re }, { dropoffPoint: re }, { vehicleNumber: re }, { driverName: re }];
    }

    const [routes, total] = await Promise.all([
      TransportRoute.find(filter).sort({ active: -1, name: 1, _id: 1 }).skip(skip).limit(limit).lean(),
      TransportRoute.countDocuments(filter)
    ]);

    const totalPages = Math.max(Math.ceil(total / limit), 1);
    res.json({
      routes,
      pagination: {
        page,
        limit,
        total,
        totalPages,
        hasPrev: page > 1,
        hasNext: page < totalPages
      }
    });
  } catch (err) {
    next(err);
  }
}

async function listParentChildren(req, res, next) {
  try {
    if (String(req.user.role || '') !== 'Parent') {
      return res.status(403).json({ error: 'Forbidden' });
    }

    const children = await Student.find({ parents: req.user.id })
      .select('_id user studentId class section')
      .sort({ studentId: 1, _id: 1 })
      .lean();

    const userIds = children.map((row) => row.user).filter(Boolean);
    const [users, enrollments] = await Promise.all([
      User.find({ _id: { $in: userIds } }).select('_id name').lean(),
      TransportEnrollment.find({ student: { $in: children.map((row) => row._id) }, status: 'enrolled' }).select('student route status').lean()
    ]);

    const userById = new Map(users.map((row) => [String(row._id), row]));
    const enrollmentByStudent = new Map(enrollments.map((row) => [String(row.student), row]));

    const rows = children.map((child) => ({
      _id: child._id,
      user: child.user,
      name: userById.get(String(child.user))?.name || 'Child',
      studentId: child.studentId,
      class: child.class,
      section: child.section,
      enrolled: enrollmentByStudent.has(String(child._id)),
      enrollmentId: enrollmentByStudent.get(String(child._id))?._id || null,
      routeId: enrollmentByStudent.get(String(child._id))?.route || null
    }));

    res.json({ children: rows });
  } catch (err) {
    next(err);
  }
}

async function createRoute(req, res, next) {
  try {
    if (!canConfigureRoutes(req.user.role)) {
      return res.status(403).json({ error: 'Forbidden' });
    }

    const route = await TransportRoute.create({
      name: String(req.body.name || '').trim(),
      code: req.body.code ? String(req.body.code).trim().toUpperCase() : undefined,
      pickupPoint: String(req.body.pickupPoint || '').trim(),
      dropoffPoint: String(req.body.dropoffPoint || '').trim(),
      fee: Number(req.body.fee || 0),
      vehicleNumber: req.body.vehicleNumber ? String(req.body.vehicleNumber).trim() : undefined,
      driverName: req.body.driverName ? String(req.body.driverName).trim() : undefined,
      driverPhone: req.body.driverPhone ? String(req.body.driverPhone).trim() : undefined,
      active: req.body.active !== undefined ? Boolean(req.body.active) : true,
      createdBy: req.user.id,
      updatedBy: req.user.id
    });

    res.status(201).json({ route });
  } catch (err) {
    next(err);
  }
}

async function updateRoute(req, res, next) {
  try {
    if (!canConfigureRoutes(req.user.role)) {
      return res.status(403).json({ error: 'Forbidden' });
    }

    const update = { updatedBy: req.user.id };
    const keys = ['name', 'pickupPoint', 'dropoffPoint', 'vehicleNumber', 'driverName', 'driverPhone'];
    for (const key of keys) {
      if (req.body[key] !== undefined) update[key] = String(req.body[key] || '').trim();
    }
    if (req.body.code !== undefined) update.code = String(req.body.code || '').trim().toUpperCase();
    if (req.body.fee !== undefined) update.fee = Number(req.body.fee);
    if (req.body.active !== undefined) update.active = Boolean(req.body.active);

    const route = await TransportRoute.findByIdAndUpdate(req.params.routeId, update, { new: true, runValidators: true });
    if (!route) return res.status(404).json({ error: 'Route not found' });

    res.json({ route });
  } catch (err) {
    next(err);
  }
}

async function deleteRoute(req, res, next) {
  try {
    if (!canConfigureRoutes(req.user.role)) {
      return res.status(403).json({ error: 'Forbidden' });
    }
    if (deniedDeleteForPrincipal(req.user)) {
      return res.status(403).json({ error: 'Principal cannot delete routes' });
    }

    const route = await TransportRoute.findByIdAndDelete(req.params.routeId);
    if (!route) return res.status(404).json({ error: 'Route not found' });

    res.json({ success: true });
  } catch (err) {
    next(err);
  }
}

async function listEnrollments(req, res, next) {
  try {
    const role = String(req.user.role || '');
    const { status, subjectRole, routeId } = req.query;
    const { page, limit, skip } = buildPagination(req.query);

    const filter = {};
    if (status) filter.status = normalizeStatus(status, ['enrolled', 'inactive'], 'enrolled');
    if (subjectRole) filter.subjectRole = subjectRole;
    if (routeId && mongoose.Types.ObjectId.isValid(routeId)) filter.route = routeId;

    if (isManagerRole(role)) {
      // Managers can view all.
    } else if (role === 'Student') {
      filter.user = req.user.id;
      filter.subjectRole = 'Student';
    } else if (role === 'Teacher') {
      filter.user = req.user.id;
      filter.subjectRole = 'Teacher';
    } else if (role === 'Parent') {
      const children = await getParentStudentIds(req.user.id);
      const childIds = children.map((row) => row._id);
      filter.student = { $in: childIds.length ? childIds : [new mongoose.Types.ObjectId()] };
      filter.subjectRole = 'Student';
    } else {
      return res.status(403).json({ error: 'Forbidden' });
    }

    const [enrollments, total] = await Promise.all([
      TransportEnrollment.find(filter)
        .populate('route')
        .populate('user', 'name username role')
        .populate('student', 'studentId class section')
        .populate('teacher', 'employeeId designation')
        .sort({ updatedAt: -1, _id: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      TransportEnrollment.countDocuments(filter)
    ]);

    const totalPages = Math.max(Math.ceil(total / limit), 1);
    res.json({
      enrollments,
      pagination: {
        page,
        limit,
        total,
        totalPages,
        hasPrev: page > 1,
        hasNext: page < totalPages
      }
    });
  } catch (err) {
    next(err);
  }
}

async function createEnrollment(req, res, next) {
  try {
    if (!isManagerRole(req.user.role)) {
      return res.status(403).json({ error: 'Forbidden' });
    }

    const route = await TransportRoute.findById(req.body.routeId).select('_id active fee').lean();
    if (!route || !route.active) return res.status(404).json({ error: 'Active route not found' });

    const subject = await resolveTransportSubject({
      requester: req.user,
      subjectRole: req.body.subjectRole,
      studentId: req.body.studentId || null,
      teacherId: req.body.teacherId || null,
      teacherUserId: req.body.teacherUserId || null
    });
    if (subject.error) return res.status(400).json({ error: subject.error });

    const enrollment = await TransportEnrollment.findOneAndUpdate(
      { user: subject.userId, subjectRole: subject.subjectRole },
      {
        route: route._id,
        user: subject.userId,
        subjectRole: subject.subjectRole,
        student: subject.studentId,
        teacher: subject.teacherId,
        status: 'enrolled',
        notes: req.body.notes ? String(req.body.notes).trim() : undefined,
        enrolledOn: new Date(),
        deactivatedOn: null,
        assignedBy: req.user.id,
        updatedBy: req.user.id
      },
      { new: true, upsert: true, setDefaultsOnInsert: true, runValidators: true }
    )
      .populate('route')
      .populate('user', 'name username role')
      .populate('student', 'studentId class section')
      .populate('teacher', 'employeeId designation');

    if (subject.subjectRole === 'Student' && subject.studentId) {
      await Promise.all([
        Student.findByIdAndUpdate(subject.studentId, { availTransport: true }),
        Transport.findOneAndUpdate(
          { student: subject.studentId },
          {
            student: subject.studentId,
            route: String(enrollment.route?.name || '').trim(),
            pickupPoint: String(enrollment.route?.pickupPoint || '').trim(),
            dropoffPoint: String(enrollment.route?.dropoffPoint || '').trim(),
            transportFee: Number(enrollment.route?.fee || 0),
            active: true
          },
          { upsert: true, setDefaultsOnInsert: true, runValidators: true }
        )
      ]);
    }

    res.status(201).json({ enrollment });
  } catch (err) {
    next(err);
  }
}

async function updateEnrollment(req, res, next) {
  try {
    if (!isManagerRole(req.user.role)) {
      return res.status(403).json({ error: 'Forbidden' });
    }

    const enrollment = await TransportEnrollment.findById(req.params.enrollmentId);
    if (!enrollment) return res.status(404).json({ error: 'Enrollment not found' });

    if (req.body.routeId) {
      const route = await TransportRoute.findById(req.body.routeId).select('_id active').lean();
      if (!route || !route.active) return res.status(400).json({ error: 'Route not found or inactive' });
      enrollment.route = route._id;
    }

    if (req.body.status) {
      enrollment.status = req.body.status;
      enrollment.deactivatedOn = req.body.status === 'inactive' ? new Date() : null;
    }

    if (req.body.notes !== undefined) {
      enrollment.notes = req.body.notes ? String(req.body.notes).trim() : undefined;
    }

    enrollment.updatedBy = req.user.id;
    await enrollment.save();

    await enrollment.populate('route');
    await enrollment.populate('user', 'name username role');
    await enrollment.populate('student', 'studentId class section');
    await enrollment.populate('teacher', 'employeeId designation');

    if (enrollment.subjectRole === 'Student' && enrollment.student) {
      const active = enrollment.status === 'enrolled';
      await Promise.all([
        Student.findByIdAndUpdate(enrollment.student, { availTransport: active }),
        Transport.findOneAndUpdate(
          { student: enrollment.student },
          {
            student: enrollment.student,
            route: String(enrollment.route?.name || '').trim(),
            pickupPoint: String(enrollment.route?.pickupPoint || '').trim(),
            dropoffPoint: String(enrollment.route?.dropoffPoint || '').trim(),
            transportFee: Number(enrollment.route?.fee || 0),
            active
          },
          { upsert: true, setDefaultsOnInsert: true, runValidators: true }
        )
      ]);
    }

    res.json({ enrollment });
  } catch (err) {
    next(err);
  }
}

async function deleteEnrollment(req, res, next) {
  try {
    if (!isManagerRole(req.user.role)) {
      return res.status(403).json({ error: 'Forbidden' });
    }
    if (!canDeleteAsRole(req.user.role)) {
      return res.status(403).json({ error: 'Principal cannot delete enrollments' });
    }

    const enrollment = await TransportEnrollment.findByIdAndDelete(req.params.enrollmentId).lean();
    if (!enrollment) return res.status(404).json({ error: 'Enrollment not found' });

    if (enrollment.subjectRole === 'Student' && enrollment.student) {
      await Promise.all([
        Student.findByIdAndUpdate(enrollment.student, { availTransport: false }),
        Transport.findOneAndUpdate({ student: enrollment.student }, { active: false })
      ]);
    }

    await TransportPayment.deleteMany({ enrollment: enrollment._id });
    res.json({ success: true });
  } catch (err) {
    next(err);
  }
}

async function createRequest(req, res, next) {
  try {
    const role = String(req.user.role || '');
    if (!['Student', 'Teacher', 'Parent'].includes(role)) {
      return res.status(403).json({ error: 'Forbidden' });
    }

    const route = await TransportRoute.findById(req.body.routeId).select('_id active').lean();
    if (!route || !route.active) return res.status(404).json({ error: 'Active route not found' });

    const subject = await resolveTransportSubject({
      requester: req.user,
      studentId: req.body.studentId || null
    });
    if (subject.error) return res.status(400).json({ error: subject.error });

    const exists = await TransportEnrollment.findOne({ user: subject.userId, subjectRole: subject.subjectRole, status: 'enrolled' })
      .select('_id')
      .lean();
    if (exists) {
      return res.status(409).json({ error: 'Already enrolled in transport' });
    }

    const duplicate = await TransportRequest.findOne({
      forUser: subject.userId,
      status: 'pending'
    }).select('_id').lean();
    if (duplicate) {
      return res.status(409).json({ error: 'A pending transport request already exists' });
    }

    const request = await TransportRequest.create({
      route: route._id,
      requester: req.user.id,
      forUser: subject.userId,
      subjectRole: subject.subjectRole,
      student: subject.studentId,
      teacher: subject.teacherId,
      status: 'pending',
      reason: req.body.reason ? String(req.body.reason).trim() : undefined
    });

    const populated = await TransportRequest.findById(request._id)
      .populate('route')
      .populate('requester', 'name username role')
      .populate('forUser', 'name username role')
      .populate('student', 'studentId class section')
      .populate('teacher', 'employeeId designation')
      .lean();

    res.status(201).json({ request: populated });
  } catch (err) {
    next(err);
  }
}

async function listRequests(req, res, next) {
  try {
    const role = String(req.user.role || '');
    const { status } = req.query;
    const { page, limit, skip } = buildPagination(req.query);

    const filter = {};
    if (status) filter.status = normalizeStatus(status, ['pending', 'approved', 'rejected', 'cancelled'], 'pending');

    if (isManagerRole(role)) {
      // Managers can view all requests.
    } else if (role === 'Student' || role === 'Teacher') {
      filter.requester = req.user.id;
    } else if (role === 'Parent') {
      filter.requester = req.user.id;
    } else {
      return res.status(403).json({ error: 'Forbidden' });
    }

    const [requests, total] = await Promise.all([
      TransportRequest.find(filter)
        .populate('route')
        .populate('requester', 'name username role')
        .populate('forUser', 'name username role')
        .populate('student', 'studentId class section')
        .populate('teacher', 'employeeId designation')
        .populate('reviewedBy', 'name username role')
        .sort({ createdAt: -1, _id: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      TransportRequest.countDocuments(filter)
    ]);

    const totalPages = Math.max(Math.ceil(total / limit), 1);
    res.json({
      requests,
      pagination: {
        page,
        limit,
        total,
        totalPages,
        hasPrev: page > 1,
        hasNext: page < totalPages
      }
    });
  } catch (err) {
    next(err);
  }
}

async function updateRequestStatus(req, res, next) {
  try {
    const role = String(req.user.role || '');
    const request = await TransportRequest.findById(req.params.requestId).populate('route').populate('forUser', 'name role');
    if (!request) return res.status(404).json({ error: 'Request not found' });

    const nextStatus = String(req.body.status || '').toLowerCase();
    if (!['approved', 'rejected', 'cancelled'].includes(nextStatus)) {
      return res.status(400).json({ error: 'Invalid status' });
    }

    if (isManagerRole(role)) {
      if (request.status !== 'pending') {
        return res.status(400).json({ error: 'Only pending requests can be reviewed by manager' });
      }

      if (nextStatus === 'cancelled') {
        return res.status(400).json({ error: 'Managers can only approve or reject requests' });
      }

      request.status = nextStatus;
      request.reviewNote = req.body.reviewNote ? String(req.body.reviewNote).trim() : undefined;
      request.reviewedBy = req.user.id;
      request.reviewedAt = new Date();
      await request.save();

      if (nextStatus === 'approved') {
        const enrollment = await TransportEnrollment.findOneAndUpdate(
          { user: request.forUser._id, subjectRole: request.subjectRole },
          {
            route: request.route._id,
            user: request.forUser._id,
            subjectRole: request.subjectRole,
            student: request.student || null,
            teacher: request.teacher || null,
            status: 'enrolled',
            notes: request.reason || undefined,
            enrolledOn: new Date(),
            deactivatedOn: null,
            assignedBy: req.user.id,
            updatedBy: req.user.id
          },
          { new: true, upsert: true, setDefaultsOnInsert: true, runValidators: true }
        ).lean();

        if (request.subjectRole === 'Student' && request.student) {
          await Promise.all([
            Student.findByIdAndUpdate(request.student, { availTransport: true }),
            Transport.findOneAndUpdate(
              { student: request.student },
              {
                student: request.student,
                route: String(request.route?.name || '').trim(),
                pickupPoint: String(request.route?.pickupPoint || '').trim(),
                dropoffPoint: String(request.route?.dropoffPoint || '').trim(),
                transportFee: Number(request.route?.fee || 0),
                active: true
              },
              { upsert: true, setDefaultsOnInsert: true, runValidators: true }
            )
          ]);
        }

        if (enrollment && request.route && Number(request.route.fee) >= 0) {
          const now = new Date();
          const month = now.getUTCMonth() + 1;
          const year = now.getUTCFullYear();
          await TransportPayment.findOneAndUpdate(
            { enrollment: enrollment._id, periodMonth: month, periodYear: year },
            {
              enrollment: enrollment._id,
              route: request.route._id,
              user: request.forUser._id,
              subjectRole: request.subjectRole,
              student: request.student || null,
              teacher: request.teacher || null,
              periodMonth: month,
              periodYear: year,
              amountDue: Number(request.route.fee || 0),
              status: 'pending',
              dueDate: new Date(Date.UTC(year, now.getUTCMonth(), 25)),
              updatedBy: req.user.id
            },
            { upsert: true, new: true, setDefaultsOnInsert: true, runValidators: true }
          );
        }
      }

      const populated = await TransportRequest.findById(request._id)
        .populate('route')
        .populate('requester', 'name username role')
        .populate('forUser', 'name username role')
        .populate('student', 'studentId class section')
        .populate('teacher', 'employeeId designation')
        .populate('reviewedBy', 'name username role')
        .lean();

      return res.json({ request: populated });
    }

    if (nextStatus !== 'cancelled') {
      return res.status(403).json({ error: 'Only managers can approve or reject requests' });
    }

    if (String(request.requester) !== String(req.user.id)) {
      return res.status(403).json({ error: 'You can only cancel your own request' });
    }
    if (request.status !== 'pending') {
      return res.status(400).json({ error: 'Only pending requests can be cancelled' });
    }

    request.status = 'cancelled';
    request.reviewNote = req.body.reviewNote ? String(req.body.reviewNote).trim() : undefined;
    request.reviewedBy = req.user.id;
    request.reviewedAt = new Date();
    await request.save();

    const populated = await TransportRequest.findById(request._id)
      .populate('route')
      .populate('requester', 'name username role')
      .populate('forUser', 'name username role')
      .populate('student', 'studentId class section')
      .populate('teacher', 'employeeId designation')
      .populate('reviewedBy', 'name username role')
      .lean();

    return res.json({ request: populated });
  } catch (err) {
    next(err);
  }
}

async function listPayments(req, res, next) {
  try {
    const role = String(req.user.role || '');
    const { status, routeId, year, month, subjectRole } = req.query;
    const { page, limit, skip } = buildPagination(req.query);

    const filter = {};
    if (status) filter.status = normalizeStatus(status, ['paid', 'pending', 'partial', 'overdue'], 'pending');
    if (subjectRole) filter.subjectRole = subjectRole;
    if (routeId && mongoose.Types.ObjectId.isValid(routeId)) filter.route = routeId;
    if (year) filter.periodYear = Number(year);
    if (month) filter.periodMonth = Number(month);

    if (isManagerRole(role)) {
      // Managers can view all payments.
    } else if (role === 'Student') {
      filter.user = req.user.id;
      filter.subjectRole = 'Student';
    } else if (role === 'Teacher') {
      filter.user = req.user.id;
      filter.subjectRole = 'Teacher';
    } else if (role === 'Parent') {
      const children = await getParentStudentIds(req.user.id);
      const childIds = children.map((row) => row._id);
      filter.student = { $in: childIds.length ? childIds : [new mongoose.Types.ObjectId()] };
      filter.subjectRole = 'Student';
    } else {
      return res.status(403).json({ error: 'Forbidden' });
    }

    const [payments, total] = await Promise.all([
      TransportPayment.find(filter)
        .populate('route')
        .populate('enrollment')
        .populate('user', 'name username role')
        .populate('student', 'studentId class section')
        .populate('teacher', 'employeeId designation')
        .sort({ periodYear: -1, periodMonth: -1, createdAt: -1, _id: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      TransportPayment.countDocuments(filter)
    ]);

    const totalPages = Math.max(Math.ceil(total / limit), 1);
    res.json({
      payments,
      pagination: {
        page,
        limit,
        total,
        totalPages,
        hasPrev: page > 1,
        hasNext: page < totalPages
      }
    });
  } catch (err) {
    next(err);
  }
}

async function createPayment(req, res, next) {
  try {
    if (!isManagerRole(req.user.role)) {
      return res.status(403).json({ error: 'Forbidden' });
    }

    const enrollment = await TransportEnrollment.findById(req.body.enrollmentId).populate('route').lean();
    if (!enrollment) return res.status(404).json({ error: 'Enrollment not found' });

    const doc = await TransportPayment.findOneAndUpdate(
      {
        enrollment: enrollment._id,
        periodMonth: Number(req.body.periodMonth),
        periodYear: Number(req.body.periodYear)
      },
      {
        enrollment: enrollment._id,
        route: enrollment.route?._id || enrollment.route,
        user: enrollment.user,
        subjectRole: enrollment.subjectRole,
        student: enrollment.student || null,
        teacher: enrollment.teacher || null,
        periodMonth: Number(req.body.periodMonth),
        periodYear: Number(req.body.periodYear),
        amountDue: Number(req.body.amountDue),
        amountPaid: Number(req.body.amountPaid || 0),
        status: String(req.body.status || '').toLowerCase(),
        dueDate: req.body.dueDate || null,
        paidOn: req.body.paidOn || null,
        remarks: req.body.remarks ? String(req.body.remarks).trim() : undefined,
        updatedBy: req.user.id
      },
      { new: true, upsert: true, setDefaultsOnInsert: true, runValidators: true }
    )
      .populate('route')
      .populate('enrollment')
      .populate('user', 'name username role')
      .populate('student', 'studentId class section')
      .populate('teacher', 'employeeId designation');

    res.status(201).json({ payment: doc });
  } catch (err) {
    next(err);
  }
}

async function updatePayment(req, res, next) {
  try {
    if (!isManagerRole(req.user.role)) {
      return res.status(403).json({ error: 'Forbidden' });
    }

    const payment = await TransportPayment.findById(req.params.paymentId);
    if (!payment) return res.status(404).json({ error: 'Payment not found' });

    if (req.body.amountDue !== undefined) payment.amountDue = Number(req.body.amountDue);
    if (req.body.amountPaid !== undefined) payment.amountPaid = Number(req.body.amountPaid);
    if (req.body.status !== undefined) payment.status = String(req.body.status).toLowerCase();
    if (req.body.dueDate !== undefined) payment.dueDate = req.body.dueDate || null;
    if (req.body.paidOn !== undefined) payment.paidOn = req.body.paidOn || null;
    if (req.body.remarks !== undefined) payment.remarks = req.body.remarks ? String(req.body.remarks).trim() : undefined;
    payment.updatedBy = req.user.id;

    await payment.save();

    await payment.populate('route');
    await payment.populate('enrollment');
    await payment.populate('user', 'name username role');
    await payment.populate('student', 'studentId class section');
    await payment.populate('teacher', 'employeeId designation');

    res.json({ payment });
  } catch (err) {
    next(err);
  }
}

async function deletePayment(req, res, next) {
  try {
    if (!isManagerRole(req.user.role)) {
      return res.status(403).json({ error: 'Forbidden' });
    }
    if (!canDeleteAsRole(req.user.role)) {
      return res.status(403).json({ error: 'Principal cannot delete payments' });
    }

    const payment = await TransportPayment.findByIdAndDelete(req.params.paymentId);
    if (!payment) return res.status(404).json({ error: 'Payment not found' });

    res.json({ success: true });
  } catch (err) {
    next(err);
  }
}

async function paymentSummaryReport(req, res, next) {
  try {
    if (!['Admin', 'Principal'].includes(String(req.user.role || ''))) {
      return res.status(403).json({ error: 'Forbidden' });
    }

    const match = {};
    if (req.query.year) match.periodYear = Number(req.query.year);
    if (req.query.month) match.periodMonth = Number(req.query.month);
    if (req.query.routeId && mongoose.Types.ObjectId.isValid(req.query.routeId)) match.route = toObjectId(req.query.routeId);

    const statusBreakdown = await TransportPayment.aggregate([
      { $match: match },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 },
          amountDue: { $sum: '$amountDue' },
          amountPaid: { $sum: '$amountPaid' }
        }
      }
    ]);

    const totals = await TransportPayment.aggregate([
      { $match: match },
      {
        $group: {
          _id: null,
          records: { $sum: 1 },
          amountDue: { $sum: '$amountDue' },
          amountPaid: { $sum: '$amountPaid' }
        }
      }
    ]);

    res.json({
      breakdown: statusBreakdown,
      totals: totals[0] || { records: 0, amountDue: 0, amountPaid: 0 }
    });
  } catch (err) {
    next(err);
  }
}

async function defaultersReport(req, res, next) {
  try {
    if (!['Admin', 'Principal'].includes(String(req.user.role || ''))) {
      return res.status(403).json({ error: 'Forbidden' });
    }

    const match = { status: { $in: ['pending', 'partial', 'overdue'] } };
    if (req.query.year) match.periodYear = Number(req.query.year);
    if (req.query.month) match.periodMonth = Number(req.query.month);
    if (req.query.routeId && mongoose.Types.ObjectId.isValid(req.query.routeId)) match.route = toObjectId(req.query.routeId);

    const rows = await TransportPayment.find(match)
      .populate('route')
      .populate('user', 'name username role')
      .populate('student', 'studentId class section')
      .populate('teacher', 'employeeId designation')
      .sort({ periodYear: -1, periodMonth: -1, amountDue: -1, _id: -1 })
      .lean();

    res.json({ defaulters: rows });
  } catch (err) {
    next(err);
  }
}

async function routeCountsReport(req, res, next) {
  try {
    if (!['Admin', 'Principal'].includes(String(req.user.role || ''))) {
      return res.status(403).json({ error: 'Forbidden' });
    }

    const rows = await TransportEnrollment.aggregate([
      { $match: { status: 'enrolled' } },
      {
        $group: {
          _id: '$route',
          totalEnrolled: { $sum: 1 },
          students: {
            $sum: {
              $cond: [{ $eq: ['$subjectRole', 'Student'] }, 1, 0]
            }
          },
          teachers: {
            $sum: {
              $cond: [{ $eq: ['$subjectRole', 'Teacher'] }, 1, 0]
            }
          }
        }
      },
      {
        $lookup: {
          from: 'transportroutes',
          localField: '_id',
          foreignField: '_id',
          as: 'route'
        }
      },
      { $unwind: { path: '$route', preserveNullAndEmptyArrays: true } },
      {
        $project: {
          _id: 0,
          routeId: '$_id',
          routeName: '$route.name',
          routeCode: '$route.code',
          pickupPoint: '$route.pickupPoint',
          dropoffPoint: '$route.dropoffPoint',
          totalEnrolled: 1,
          students: 1,
          teachers: 1
        }
      },
      { $sort: { totalEnrolled: -1, routeName: 1 } }
    ]);

    res.json({ routes: rows });
  } catch (err) {
    next(err);
  }
}

async function revenueTrendReport(req, res, next) {
  try {
    if (!['Admin', 'Principal'].includes(String(req.user.role || ''))) {
      return res.status(403).json({ error: 'Forbidden' });
    }

    const match = {};
    if (req.query.year) match.periodYear = Number(req.query.year);

    const rows = await TransportPayment.aggregate([
      { $match: match },
      {
        $group: {
          _id: { year: '$periodYear', month: '$periodMonth' },
          dueTotal: { $sum: '$amountDue' },
          paidTotal: { $sum: '$amountPaid' },
          records: { $sum: 1 }
        }
      },
      { $sort: { '_id.year': 1, '_id.month': 1 } },
      {
        $project: {
          _id: 0,
          year: '$_id.year',
          month: '$_id.month',
          dueTotal: 1,
          paidTotal: 1,
          records: 1
        }
      }
    ]);

    res.json({ trend: rows });
  } catch (err) {
    next(err);
  }
}

async function exportPaymentsCsv(req, res, next) {
  try {
    if (!['Admin', 'Principal'].includes(String(req.user.role || ''))) {
      return res.status(403).json({ error: 'Forbidden' });
    }

    const match = {};
    if (req.query.status) match.status = normalizeStatus(req.query.status, ['paid', 'pending', 'partial', 'overdue'], 'pending');
    if (req.query.year) match.periodYear = Number(req.query.year);
    if (req.query.month) match.periodMonth = Number(req.query.month);
    if (req.query.routeId && mongoose.Types.ObjectId.isValid(req.query.routeId)) match.route = toObjectId(req.query.routeId);

    const rows = await TransportPayment.find(match)
      .populate('route')
      .populate('user', 'name username role')
      .populate('student', 'studentId class section')
      .populate('teacher', 'employeeId designation')
      .sort({ periodYear: -1, periodMonth: -1, createdAt: -1 })
      .lean();

    const header = [
      'periodYear',
      'periodMonth',
      'subjectRole',
      'name',
      'username',
      'routeName',
      'status',
      'amountDue',
      'amountPaid',
      'dueDate',
      'paidOn'
    ];

    const lines = [header.join(',')];
    for (const row of rows) {
      const name = row?.user?.name || '';
      const username = row?.user?.username || '';
      const routeName = row?.route?.name || '';
      const fields = [
        row.periodYear,
        row.periodMonth,
        row.subjectRole,
        `"${String(name).replace(/"/g, '""')}"`,
        `"${String(username).replace(/"/g, '""')}"`,
        `"${String(routeName).replace(/"/g, '""')}"`,
        row.status,
        row.amountDue,
        row.amountPaid,
        row.dueDate ? new Date(row.dueDate).toISOString() : '',
        row.paidOn ? new Date(row.paidOn).toISOString() : ''
      ];
      lines.push(fields.join(','));
    }

    const csv = lines.join('\n');
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', 'attachment; filename="transport-payments.csv"');
    res.status(200).send(csv);
  } catch (err) {
    next(err);
  }
}

module.exports = {
  listRoutes,
  listParentChildren,
  createRoute,
  updateRoute,
  deleteRoute,
  listEnrollments,
  createEnrollment,
  updateEnrollment,
  deleteEnrollment,
  createRequest,
  listRequests,
  updateRequestStatus,
  listPayments,
  createPayment,
  updatePayment,
  deletePayment,
  paymentSummaryReport,
  defaultersReport,
  routeCountsReport,
  revenueTrendReport,
  exportPaymentsCsv
};
