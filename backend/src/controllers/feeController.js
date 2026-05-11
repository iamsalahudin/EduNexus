const { Fee, FeeVoucherTemplate, Student, User, SchoolClass } = require('../models');
const mongoose = require('mongoose');

function toObjectId(value) {
  try {
    return new mongoose.Types.ObjectId(String(value));
  } catch (_) {
    return null;
  }
}

function toTitleCaseStatus(status) {
  const raw = String(status || '').toLowerCase();
  if (raw === 'paid') return 'Paid';
  if (raw === 'overdue') return 'Overdue';
  return 'Pending';
}

function monthRange(date = new Date()) {
  const start = new Date(date.getFullYear(), date.getMonth(), 1);
  const end = new Date(date.getFullYear(), date.getMonth() + 1, 1);
  return { start, end };
}

function monthKey(date = new Date()) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  return `${year}-${month}`;
}

function clampPercent(value) {
  const num = Number(value);
  if (!Number.isFinite(num)) return 0;
  return Math.max(0, Math.min(100, num));
}

function toMoney(value) {
  const num = Number(value);
  if (!Number.isFinite(num)) return 0;
  return Math.max(0, Math.round(num));
}

function parseDateInput(value) {
  if (!value) return null;
  const parsed = new Date(String(value));
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function buildDateRange(query = {}) {
  const preset = String(query?.period || '').trim().toLowerCase();
  const now = new Date();

  if (preset === 'this-month') {
    const start = new Date(now.getFullYear(), now.getMonth(), 1);
    const end = new Date(now.getFullYear(), now.getMonth() + 1, 1);
    return { preset, start, end };
  }

  if (preset === 'last-month') {
    const start = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const end = new Date(now.getFullYear(), now.getMonth(), 1);
    return { preset, start, end };
  }

  if (preset === 'this-year') {
    const start = new Date(now.getFullYear(), 0, 1);
    const end = new Date(now.getFullYear() + 1, 0, 1);
    return { preset, start, end };
  }

  if (preset === 'last-year') {
    const start = new Date(now.getFullYear() - 1, 0, 1);
    const end = new Date(now.getFullYear(), 0, 1);
    return { preset, start, end };
  }

  if (preset === 'custom') {
    const from = parseDateInput(query?.from);
    const to = parseDateInput(query?.to);
    if (!from || !to) return null;
    const start = new Date(from.getFullYear(), from.getMonth(), from.getDate());
    const end = new Date(to.getFullYear(), to.getMonth(), to.getDate() + 1);
    return { preset, start, end };
  }

  const year = Number(query?.year);
  const month = Number(query?.month);
  if (Number.isInteger(year) && year >= 2000 && year <= 2100 && Number.isInteger(month) && month >= 1 && month <= 12) {
    const start = new Date(year, month - 1, 1);
    const end = new Date(year, month, 1);
    return { preset: 'month', start, end };
  }

  return null;
}

function isWithinRange(value, range) {
  if (!range) return true;
  const date = parseDateInput(value);
  if (!date) return false;
  return date >= range.start && date < range.end;
}

function buildPeriodRows(transactions = [], mode = 'monthly') {
  const map = new Map();
  transactions.forEach((row) => {
    const sourceDate = row?.voucherDate || row?.dueDate;
    const date = parseDateInput(sourceDate);
    if (!date) return;
    const key = mode === 'yearly'
      ? String(date.getFullYear())
      : `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;

    if (!map.has(key)) {
      map.set(key, { period: key, paid: 0, due: 0, total: 0 });
    }

    const amount = Number(row?.totalFee || 0);
    const bucket = map.get(key);
    bucket.total += amount;
    if (String(row?.status || '').toLowerCase() === 'paid') bucket.paid += amount;
    else bucket.due += amount;
  });

  return [...map.values()].sort((a, b) => a.period.localeCompare(b.period));
}

function buildRecentMonthlySeries(fees = [], months = 6) {
  const now = new Date();
  const keys = [];
  const labels = [];

  for (let offset = months - 1; offset >= 0; offset -= 1) {
    const date = new Date(now.getFullYear(), now.getMonth() - offset, 1);
    const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
    keys.push(key);
    labels.push(date.toLocaleString('en', { month: 'short' }));
  }

  const series = keys.map((period, index) => ({
    period,
    label: labels[index],
    collected: 0,
    pending: 0,
    fees: 0
  }));

  const bucketMap = new Map(series.map((item) => [item.period, item]));

  fees.forEach((fee) => {
    const dueDate = fee?.dueDate ? new Date(fee.dueDate) : null;
    if (!dueDate || Number.isNaN(dueDate.getTime())) return;
    const key = `${dueDate.getFullYear()}-${String(dueDate.getMonth() + 1).padStart(2, '0')}`;
    const bucket = bucketMap.get(key);
    if (!bucket) return;

    const paidSum = (fee.payments || []).reduce((sum, payment) => sum + Number(payment?.amount || 0), 0);
    bucket.collected += paidSum;
    bucket.pending += Math.max(0, Number(fee.amount || 0) - paidSum);
    bucket.fees += Number(fee.amount || 0);
  });

  return series.map(({ period, label, collected, pending, fees: feeAmount }) => ({
    period,
    name: label,
    collected,
    pending,
    fees: feeAmount
  }));
}

async function ensureMonthlyFeesGenerated({ studentIds = null, targetDate = new Date() } = {}) {
  if (Array.isArray(studentIds) && studentIds.length === 0) {
    return { createdCount: 0, month: monthKey(targetDate), totalCandidates: 0 };
  }

  const cycle = monthKey(targetDate);
  const { start: cycleStart } = monthRange(targetDate);
  const studentFilter = { status: 'incampus' };
  if (Array.isArray(studentIds)) {
    studentFilter._id = { $in: studentIds };
  }

  const students = await Student.find(studentFilter).select('_id class section tutionFeeConcession').lean();
  if (!students.length) {
    return { createdCount: 0, month: cycle, totalCandidates: 0 };
  }

  const classes = [...new Set(students.map((s) => String(s.class || '').trim()).filter(Boolean))];
  const classRows = await SchoolClass.find({ name: { $in: classes } }).select('name tutionFee').lean();
  const classFeeMap = new Map(classRows.map((row) => [String(row.name || '').trim(), Number(row.tutionFee || 0)]));

  const existingRows = await Fee.find({
    student: { $in: students.map((s) => s._id) },
    cycleMonth: cycle
  }).select('student').lean();
  const existingStudentIds = new Set(existingRows.map((row) => String(row.student)));

  const newMonthlyFees = students
    .filter((student) => !existingStudentIds.has(String(student._id)))
    .map((student) => {
      const baseAmount = toMoney(classFeeMap.get(String(student.class || '').trim()) || 0);
      const concessionPercent = clampPercent(student?.tutionFeeConcession);
      const discounted = baseAmount - (baseAmount * concessionPercent) / 100;
      const amount = toMoney(discounted);
      return {
        student: student._id,
        source: 'monthly',
        cycleMonth: cycle,
        baseAmount,
        concessionPercent,
        amount,
        dueDate: cycleStart,
        status: amount > 0 ? 'pending' : 'paid',
        notes: `Auto-generated monthly tuition for ${cycle}`
      };
    });

  if (!newMonthlyFees.length) {
    return { createdCount: 0, month: cycle, totalCandidates: students.length };
  }

  let createdCount = 0;
  try {
    const inserted = await Fee.insertMany(newMonthlyFees, { ordered: false });
    createdCount = Array.isArray(inserted) ? inserted.length : 0;
  } catch (err) {
    if (err?.code === 11000 || /duplicate key/i.test(String(err?.message || ''))) {
      createdCount = 0;
    } else {
      throw err;
    }
  }

  return { createdCount, month: cycle, totalCandidates: students.length };
}

async function resolveScopedStudents(req) {
  const role = String(req.user?.role || '');
  const queryStudentId = String(req.query?.studentId || '').trim();
  const queryChildId = String(req.query?.childId || '').trim();

  if (role === 'Student') {
    const me = await Student.findOne({ user: req.user.id }).select('_id');
    return me ? [me._id] : [];
  }

  if (role === 'Parent') {
    const parentChildren = await Student.find({ parents: req.user.id }).select('_id');
    const childIds = parentChildren.map((s) => s._id);
    if (!childIds.length) return [];

    if (queryChildId) {
      const childObjectId = toObjectId(queryChildId);
      if (!childObjectId) return [];
      return childIds.filter((id) => String(id) === String(childObjectId));
    }

    return childIds;
  }

  if (queryStudentId) {
    const studentObjectId = toObjectId(queryStudentId);
    return studentObjectId ? [studentObjectId] : [];
  }

  return null;
}

async function buildStudentCardMap(studentIds = null) {
  const filter = studentIds && Array.isArray(studentIds) ? { _id: { $in: studentIds } } : {};
  const students = await Student.find(filter)
    .populate('user', 'name')
    .populate('parents', 'name')
    .select('studentId rollNumber class section gender tutionFeeConcession availTransport user parents');

  const map = new Map();
  students.forEach((student) => {
    map.set(String(student._id), {
      studentId: String(student._id),
      roll: String(student.rollNumber || student.studentId || '').trim(),
      registrationNumber: String(student.studentId || '').trim(),
      name: String(student.user?.name || '').trim(),
      father: String(student.parents?.[0]?.name || '').trim(),
      class: String(student.class || '').trim(),
      section: String(student.section || '').trim(),
      gender: String(student.gender || '').trim(),
      concession: Number(student.tutionFeeConcession || 0),
      transport: student.availTransport ? 'Yes' : 'No'
    });
  });
  return map;
}

// Create a fee entry for a student (Admin/Finance)
async function createFee(req, res, next) {
  try {
    const { studentId, amount, dueDate, notes } = req.body;
    if (!studentId || !amount) return res.status(400).json({ error: 'Missing required fields' });

    const student = await Student.findById(studentId);
    if (!student) return res.status(404).json({ error: 'Student not found' });

    const numericAmount = Number(amount || 0);
    const fee = await Fee.create({
      student: studentId,
      source: 'manual',
      baseAmount: numericAmount,
      concessionPercent: 0,
      amount: numericAmount,
      dueDate: dueDate ? new Date(dueDate) : undefined,
      notes
    });
    res.status(201).json({ fee });
  } catch (err) {
    next(err);
  }
}

// Get fees (role-based)
async function getFees(req, res, next) {
  try {
    const { status } = req.query;
    const scopedStudents = await resolveScopedStudents(req);
    await ensureMonthlyFeesGenerated({ studentIds: scopedStudents });
    const filter = {};
    if (status) filter.status = status;
    if (scopedStudents !== null) {
      filter.student = { $in: scopedStudents };
    }

    const fees = await Fee.find(filter)
      .sort({ dueDate: -1, createdAt: -1 })
      .populate({
        path: 'student',
        select: 'studentId rollNumber class section user',
        populate: { path: 'user', select: 'name' }
      });

    res.json({ fees });
  } catch (err) {
    next(err);
  }
}

async function getFeeSummary(req, res, next) {
  try {
    const scopedStudents = await resolveScopedStudents(req);
    await ensureMonthlyFeesGenerated({ studentIds: scopedStudents });
    const filter = {};
    if (scopedStudents !== null) {
      filter.student = { $in: scopedStudents };
    }

    const fees = await Fee.find(filter).select('student amount status dueDate payments');
    const studentIds = new Set(fees.map((f) => String(f.student)).filter(Boolean));
    const { start: monthStart, end: monthEnd } = monthRange();

    let paidThisMonth = 0;
    let pendingCount = 0;
    let totalCollected = 0;
    let incomingFeeThisMonth = 0;
    let pendingLiabilityThisMonth = 0;

    fees.forEach((fee) => {
      const paidSum = (fee.payments || []).reduce((sum, p) => sum + Number(p?.amount || 0), 0);
      totalCollected += paidSum;

      if (fee.status !== 'paid') pendingCount += 1;
      if (fee.status === 'paid' && fee.dueDate && fee.dueDate >= monthStart && fee.dueDate < monthEnd) {
        paidThisMonth += 1;
      }

      (fee.payments || []).forEach((payment) => {
        const paidAt = payment?.paidAt ? new Date(payment.paidAt) : null;
        if (paidAt && paidAt >= monthStart && paidAt < monthEnd) {
          incomingFeeThisMonth += Number(payment.amount || 0);
        }
      });

      const dueDate = fee?.dueDate ? new Date(fee.dueDate) : null;
      if (dueDate && dueDate >= monthStart && dueDate < monthEnd) {
        const pending = Math.max(0, Number(fee.amount || 0) - paidSum);
        pendingLiabilityThisMonth += pending;
      }
    });

    return res.json({
      totalStudents: studentIds.size,
      paidThisMonth,
      pendingCount,
      totalCollected,
      incomingFeeThisMonth,
      pendingLiabilityThisMonth,
      monthlySeries: buildRecentMonthlySeries(fees, 6)
    });
  } catch (err) {
    next(err);
  }
}

async function getFeeRecords(req, res, next) {
  try {
    const scopedStudents = await resolveScopedStudents(req);
    await ensureMonthlyFeesGenerated({ studentIds: scopedStudents });
    const range = buildDateRange(req.query);
    const studentCards = await buildStudentCardMap(scopedStudents);
    const studentIds = [...studentCards.keys()];

    if (!studentIds.length) return res.json([]);

    const fees = await Fee.find({ student: { $in: studentIds } })
      .sort({ dueDate: -1, createdAt: -1 })
      .select('student amount status dueDate payments createdAt');

    const rowMap = new Map();

    fees.forEach((fee) => {
      if (!isWithinRange(fee?.dueDate || fee?.createdAt, range)) {
        return;
      }

      const sid = String(fee.student);
      if (!rowMap.has(sid)) {
        rowMap.set(sid, {
          id: sid,
          feeId: String(fee._id),
          roll: studentCards.get(sid)?.roll || '—',
          name: studentCards.get(sid)?.name || '—',
          father: studentCards.get(sid)?.father || '—',
          class: studentCards.get(sid)?.class || '—',
          section: studentCards.get(sid)?.section || '—',
          gender: studentCards.get(sid)?.gender || '—',
          feeType: 'Tuition',
          monthlyFee: 0,
          lastPaymentDate: '',
          pendingFee: 0,
          status: 'Pending'
        });
      }

      const row = rowMap.get(sid);
      if (!row.feeId) row.feeId = String(fee._id);
      row.monthlyFee = Math.max(row.monthlyFee, Number(fee.amount || 0));

      const paidSum = (fee.payments || []).reduce((sum, p) => sum + Number(p?.amount || 0), 0);
      const pending = Math.max(0, Number(fee.amount || 0) - paidSum);
      row.pendingFee += pending;

      (fee.payments || []).forEach((payment) => {
        const paidAt = payment?.paidAt ? new Date(payment.paidAt) : null;
        if (!paidAt) return;
        const paidDate = paidAt.toISOString().slice(0, 10);
        if (!row.lastPaymentDate || paidDate > row.lastPaymentDate) {
          row.lastPaymentDate = paidDate;
        }
      });
    });

    const rows = [...rowMap.values()].map((row) => ({
      ...row,
      status: row.pendingFee > 0 ? 'Pending' : 'Paid'
    }));

    return res.json(rows);
  } catch (err) {
    next(err);
  }
}

async function getFeeDefaulters(req, res, next) {
  try {
    const rows = await new Promise((resolve, reject) => {
      const fakeReq = { ...req };
      const fakeRes = {
        json(payload) {
          resolve(payload);
        }
      };
      getFeeRecords(fakeReq, fakeRes, reject);
    });

    const defaulters = (Array.isArray(rows) ? rows : []).filter((row) => Number(row.pendingFee || 0) > 0);
    return res.json(defaulters);
  } catch (err) {
    next(err);
  }
}

async function getFeeDetails(req, res, next) {
  try {
    const pathStudentId = String(req.params?.studentId || '').trim();
    const role = String(req.user?.role || '');
    let targetStudentId = pathStudentId;

    if (pathStudentId === 'self' || !pathStudentId) {
      if (role === 'Student') {
        const me = await Student.findOne({ user: req.user.id }).select('_id');
        targetStudentId = String(me?._id || '');
      } else if (role === 'Parent') {
        const childId = String(req.query?.childId || '').trim();
        if (!childId) {
          return res.status(400).json({ error: 'childId is required for parent self fee details.' });
        }
        targetStudentId = childId;
      }
    }

    const targetObjectId = toObjectId(targetStudentId);
    if (!targetObjectId) return res.status(400).json({ error: 'Invalid student id' });

    await ensureMonthlyFeesGenerated({ studentIds: [targetObjectId] });

    if (role === 'Student') {
      const me = await Student.findOne({ user: req.user.id }).select('_id');
      if (!me || String(me._id) !== String(targetObjectId)) {
        return res.status(403).json({ error: 'Forbidden' });
      }
    }

    if (role === 'Parent') {
      const child = await Student.findOne({ _id: targetObjectId, parents: req.user.id }).select('_id');
      if (!child) return res.status(403).json({ error: 'Forbidden' });
    }

    const student = await Student.findById(targetObjectId)
      .populate('user', 'name')
      .populate('parents', 'name')
      .select('studentId rollNumber class section gender tutionFeeConcession availTransport user parents');

    if (!student) return res.status(404).json({ error: 'Student not found' });

    const fees = await Fee.find({ student: targetObjectId })
      .sort({ dueDate: -1, createdAt: -1 })
      .select('amount dueDate status payments createdAt');

    const transactions = fees.map((fee, idx) => {
      const latestPayment = (fee.payments || []).slice().sort((a, b) => new Date(b.paidAt || 0) - new Date(a.paidAt || 0))[0];
      const voucherDate = fee?.createdAt ? new Date(fee.createdAt).toISOString().slice(0, 10) : '';
      return {
        feeId: String(fee._id),
        voucherDate,
        voucherNo: `V-${String(student.studentId || student._id)}-${idx + 1}`,
        dueDate: fee?.dueDate ? new Date(fee.dueDate).toISOString().slice(0, 10) : '',
        feeType: 'Tuition',
        totalFee: Number(fee.amount || 0),
        status: toTitleCaseStatus(fee.status),
        paymentDate: latestPayment?.paidAt ? new Date(latestPayment.paidAt).toISOString().slice(0, 10) : null
      };
    });

    const range = buildDateRange(req.query);
    const filteredTransactions = transactions.filter((row) => isWithinRange(row?.voucherDate || row?.dueDate, range));

    const totals = filteredTransactions.reduce((acc, row) => {
      const amount = Number(row?.totalFee || 0);
      acc.total += amount;
      if (String(row?.status || '').toLowerCase() === 'paid') acc.paid += amount;
      else acc.due += amount;
      return acc;
    }, { paid: 0, due: 0, total: 0 });

    const monthlyRows = buildPeriodRows(filteredTransactions, 'monthly');
    const yearlyRows = buildPeriodRows(filteredTransactions, 'yearly');

    const latestFee = fees[0];
    const latestPaymentDate = transactions
      .map((t) => t.paymentDate)
      .filter(Boolean)
      .sort((a, b) => b.localeCompare(a))[0] || '';

    return res.json({
      student: {
        id: String(student._id),
        roll: String(student.rollNumber || student.studentId || '').trim(),
        name: String(student.user?.name || '').trim(),
        father: String(student.parents?.[0]?.name || '').trim(),
        class: String(student.class || '').trim(),
        section: String(student.section || '').trim(),
        gender: String(student.gender || '').trim()
      },
      feeInfo: {
        monthlyFee: Number(latestFee?.amount || 0),
        lastPaymentDate: latestPaymentDate,
        concession: `${Number(student.tutionFeeConcession || 0)}%`,
        transport: student.availTransport ? 'Yes' : 'No'
      },
      transactions: filteredTransactions,
      summary: {
        period: range
          ? {
              preset: range.preset,
              from: range.start.toISOString().slice(0, 10),
              to: new Date(range.end.getTime() - 1).toISOString().slice(0, 10)
            }
          : {
              preset: 'all',
              from: null,
              to: null
            },
        totals,
        monthlyRows,
        yearlyRows,
        transactionCount: filteredTransactions.length,
        allTransactionCount: transactions.length
      }
    });
  } catch (err) {
    next(err);
  }
}

// Record a payment (Parent/Reception/Admin/Finance)
async function recordPayment(req, res, next) {
  try {
    const { amount, method, transactionId } = req.body;
    const fee = await Fee.findById(req.params.id);
    if (!fee) return res.status(404).json({ error: 'Fee not found' });

    const payment = { amount, method, transactionId, paidAt: new Date() };
    fee.payments.push(payment);

    // update status
    const paidSum = fee.payments.reduce((s, p) => s + (p.amount || 0), 0);
    if (paidSum >= fee.amount) fee.status = 'paid';
    else if (paidSum > 0) fee.status = 'pending';

    await fee.save();
    res.json({ fee });
  } catch (err) {
    next(err);
  }
}

async function updateFeeStatus(req, res, next) {
  try {
    const statusRaw = String(req.body?.status || '').toLowerCase();
    const nextStatus = statusRaw === 'paid' ? 'paid' : 'pending';

    const fee = await Fee.findById(req.params.id);
    if (!fee) return res.status(404).json({ error: 'Fee not found' });

    if (nextStatus === 'paid') {
      const paidSum = fee.payments.reduce((s, p) => s + Number(p?.amount || 0), 0);
      const remaining = Math.max(0, Number(fee.amount || 0) - paidSum);
      if (remaining > 0) {
        fee.payments.push({
          amount: remaining,
          method: 'cash',
          transactionId: 'manual-status-update',
          paidAt: new Date()
        });
      }
      fee.status = 'paid';
    } else {
      fee.status = 'pending';
    }

    await fee.save();
    return res.json({ fee });
  } catch (err) {
    next(err);
  }
}

async function generateMonthlyFees(req, res, next) {
  try {
    const yearRaw = Number(req.body?.year ?? req.query?.year ?? new Date().getFullYear());
    const monthRaw = Number(req.body?.month ?? req.query?.month ?? new Date().getMonth() + 1);
    const className = String(req.body?.class || req.query?.class || '').trim();
    const section = String(req.body?.section || req.query?.section || '').trim();

    if (!Number.isInteger(yearRaw) || yearRaw < 2000 || yearRaw > 2100) {
      return res.status(400).json({ error: 'year must be between 2000 and 2100' });
    }
    if (!Number.isInteger(monthRaw) || monthRaw < 1 || monthRaw > 12) {
      return res.status(400).json({ error: 'month must be between 1 and 12' });
    }

    let scopedStudentIds = null;
    if (className || section) {
      const studentFilter = { status: 'incampus' };
      if (className) studentFilter.class = className;
      if (section) studentFilter.section = section;
      const students = await Student.find(studentFilter).select('_id').lean();
      scopedStudentIds = students.map((student) => student._id);
    }

    const targetDate = new Date(yearRaw, monthRaw - 1, 1);
    const result = await ensureMonthlyFeesGenerated({
      studentIds: scopedStudentIds,
      targetDate
    });

    return res.json({
      ok: true,
      month: result.month,
      createdCount: result.createdCount,
      totalCandidates: result.totalCandidates,
      scope: {
        class: className || null,
        section: section || null
      }
    });
  } catch (err) {
    next(err);
  }
}

// Update fee (Admin/Finance)
async function updateFee(req, res, next) {
  try {
    const updates = req.body;
    const fee = await Fee.findByIdAndUpdate(req.params.id, updates, { new: true });
    if (!fee) return res.status(404).json({ error: 'Not found' });
    res.json({ fee });
  } catch (err) {
    next(err);
  }
}

// Delete fee (Admin)
async function deleteFee(req, res, next) {
  try {
    await Fee.findByIdAndDelete(req.params.id);
    res.json({ ok: true });
  } catch (err) {
    next(err);
  }
}

async function getFeeVoucherTemplate(req, res, next) {
  try {
    const template = await FeeVoucherTemplate.findOne({ key: 'default' }).lean();
    res.json({ template: template || null });
  } catch (err) {
    next(err);
  }
}

async function saveFeeVoucherTemplate(req, res, next) {
  try {
    const body = req.body || {};
    const update = {
      key: 'default',
      schoolName: String(body.schoolName || '').trim(),
      schoolAddress: String(body.schoolAddress || '').trim(),
      banks: Array.isArray(body.banks)
        ? body.banks.map((bank) => ({
            bankName: String(bank?.bankName || '').trim(),
            account: String(bank?.account || '').trim()
          }))
        : [],
      updatedBy: req.user?.id || undefined
    };

    const template = await FeeVoucherTemplate.findOneAndUpdate(
      { key: 'default' },
      {
        $set: update,
        $setOnInsert: { createdBy: req.user?.id || undefined }
      },
      { new: true, upsert: true, setDefaultsOnInsert: true, runValidators: true }
    ).lean();

    res.json({ template });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  createFee,
  ensureMonthlyFeesGenerated,
  generateMonthlyFees,
  getFees,
  getFeeSummary,
  getFeeRecords,
  getFeeDefaulters,
  getFeeDetails,
  recordPayment,
  updateFeeStatus,
  updateFee,
  deleteFee,
  getFeeVoucherTemplate,
  saveFeeVoucherTemplate
};