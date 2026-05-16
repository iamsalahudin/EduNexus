const PDFDocument = require('pdfkit')
const { SalaryStaff, SalarySlip, SalaryStructure, Teacher } = require('../models')

function monthKey(date = new Date()) {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  return `${year}-${month}`
}

function parseMonth(value) {
  const text = String(value || '').trim()
  if (/^\d{4}-\d{2}$/.test(text)) return text
  return monthKey(new Date())
}

function toNumber(value) {
  const num = Number(value)
  return Number.isFinite(num) && num >= 0 ? num : 0
}

function paymentTotal(payments = []) {
  return (Array.isArray(payments) ? payments : []).reduce((sum, payment) => sum + toNumber(payment?.amount), 0)
}

async function resolveSalaryStaffScope(req) {
  const role = String(req.user?.role || '')
  if (role !== 'Teacher') return null

  const staff = await SalaryStaff.findOne({ user: req.user.id, staffType: 'teacher' }).select('_id')
  if (!staff) return []
  return [staff._id]
}

async function syncTeacherSalaryStaff() {
  const teachers = await Teacher.find({ status: 'Working' })
    .populate('user', 'name username email active role')
    .select('user employeeId designation department salary contactNumber address status')

  let createdCount = 0
  for (const teacher of teachers) {
    const existing = await SalaryStaff.findOne({ teacher: teacher._id })
    if (existing) continue

    await SalaryStaff.create({
      user: teacher.user?._id || null,
      teacher: teacher._id,
      staffType: 'teacher',
      name: String(teacher.user?.name || '').trim() || `Teacher ${teacher.employeeId}`,
      employeeId: teacher.employeeId,
      designation: teacher.designation || 'Teacher',
      department: teacher.department || '',
      monthlySalary: toNumber(teacher.salary),
      salaryOnly: false,
      status: 'active'
    })
    createdCount += 1
  }

  return { createdCount }
}

async function ensureMonthlySlips({ periodMonth = null, staffIds = null } = {}) {
  const cycle = parseMonth(periodMonth)
  await syncTeacherSalaryStaff()

  const staffFilter = { status: 'active' }
  if (Array.isArray(staffIds) && staffIds.length) {
    staffFilter._id = { $in: staffIds }
  }

  const staffList = await SalaryStaff.find(staffFilter).populate('salaryStructure').lean()
  if (!staffList.length) return { periodMonth: cycle, createdCount: 0, totalCandidates: 0 }

  const existing = await SalarySlip.find({ periodMonth: cycle, staff: { $in: staffList.map((staff) => staff._id) } })
    .select('staff')
    .lean()
  const existingSet = new Set(existing.map((row) => String(row.staff)))

  const activeDefaultStructures = await SalaryStructure.find({ active: true }).lean()
  const teacherStructure = activeDefaultStructures.find((row) => row.staffType === 'teacher') || activeDefaultStructures.find((row) => row.staffType === 'all') || null
  const staffStructure = activeDefaultStructures.find((row) => row.staffType === 'staff') || activeDefaultStructures.find((row) => row.staffType === 'all') || null

  const slips = []
  for (const staff of staffList) {
    if (existingSet.has(String(staff._id))) continue

    const structure = staff.salaryStructure || (staff.staffType === 'teacher' ? teacherStructure : staffStructure) || null
    const baseSalary = toNumber(staff.monthlySalary || structure?.baseSalary)
    const allowancesTotal = toNumber(structure?.allowancesTotal)
    const deductionsTotal = toNumber(structure?.deductionsTotal)
    const grossSalary = Math.max(0, baseSalary + allowancesTotal - deductionsTotal)
    const advanceTotal = Math.min(toNumber(staff.advanceBalance), grossSalary)
    const netSalary = Math.max(0, grossSalary - advanceTotal)

    slips.push({
      staff: staff._id,
      teacher: staff.teacher || null,
      periodMonth: cycle,
      baseSalary,
      allowancesTotal,
      deductionsTotal,
      advanceTotal,
      grossSalary,
      netSalary,
      status: netSalary > 0 ? 'pending' : 'paid',
      notes: `Auto-generated salary slip for ${cycle}`
    })
  }

  if (!slips.length) return { periodMonth: cycle, createdCount: 0, totalCandidates: staffList.length }

  const inserted = await SalarySlip.insertMany(slips, { ordered: false })
  return { periodMonth: cycle, createdCount: inserted.length, totalCandidates: staffList.length }
}

async function getSalarySummary(req, res, next) {
  try {
    await syncTeacherSalaryStaff()
    const periodMonth = parseMonth(req.query?.periodMonth)
    await ensureMonthlySlips({ periodMonth })
    const scope = await resolveSalaryStaffScope(req)

    const filter = { periodMonth }
    if (scope !== null) filter.staff = { $in: scope }

    const slips = await SalarySlip.find(filter).select('staff baseSalary allowancesTotal deductionsTotal advanceTotal grossSalary netSalary status payments periodMonth')
    const staffCount = scope !== null
      ? scope.length
      : await SalaryStaff.countDocuments({ status: 'active' })
    const paidCount = slips.filter((slip) => slip.status === 'paid').length
    const pendingCount = slips.filter((slip) => slip.status === 'pending' || slip.status === 'partial').length
    const totalPayroll = slips.reduce((sum, slip) => sum + toNumber(slip.netSalary), 0)
    const paidAmount = slips.reduce((sum, slip) => sum + paymentTotal(slip.payments), 0)
    const advanceTotal = slips.reduce((sum, slip) => sum + toNumber(slip.advanceTotal), 0)

    const recentSeries = []
    for (let offset = 5; offset >= 0; offset -= 1) {
      const date = new Date()
      const target = new Date(date.getFullYear(), date.getMonth() - offset, 1)
      const key = monthKey(target)
      const monthFilter = { periodMonth: key }
      if (scope !== null) monthFilter.staff = { $in: scope }
      const monthSlips = await SalarySlip.find(monthFilter).select('netSalary payments status')
      recentSeries.push({
        periodMonth: key,
        name: target.toLocaleString('en', { month: 'short' }),
        collected: monthSlips.reduce((sum, slip) => sum + paymentTotal(slip.payments), 0),
        payable: monthSlips.reduce((sum, slip) => sum + toNumber(slip.netSalary), 0)
      })
    }

    return res.json({
      periodMonth,
      staffCount,
      slipCount: slips.length,
      paidCount,
      pendingCount,
      totalPayroll,
      paidAmount,
      advanceTotal,
      monthlySeries: recentSeries
    })
  } catch (err) {
    next(err)
  }
}

async function listSalaryStructures(req, res, next) {
  try {
    const rows = await SalaryStructure.find().sort({ active: -1, updatedAt: -1 }).lean()
    return res.json({
      structures: rows.map((row) => ({
        id: String(row._id),
        name: row.name,
        staffType: row.staffType,
        baseSalary: toNumber(row.baseSalary),
        allowancesTotal: toNumber(row.allowancesTotal),
        deductionsTotal: toNumber(row.deductionsTotal),
        active: Boolean(row.active),
        notes: row.notes || ''
      }))
    })
  } catch (err) {
    next(err)
  }
}

async function upsertSalaryStructure(req, res, next) {
  try {
    const body = req.body || {}
    const structureId = String(req.params?.id || body.id || '').trim()
    const payload = {
      name: String(body.name || '').trim(),
      staffType: ['teacher', 'staff', 'all'].includes(String(body.staffType)) ? String(body.staffType) : 'all',
      baseSalary: toNumber(body.baseSalary),
      allowancesTotal: toNumber(body.allowancesTotal),
      deductionsTotal: toNumber(body.deductionsTotal),
      active: body.active !== undefined ? Boolean(body.active) : true,
      notes: String(body.notes || '').trim()
    }

    if (!payload.name) return res.status(400).json({ error: 'name is required' })

    let structure = structureId ? await SalaryStructure.findById(structureId) : null
    const isCreate = !structure
    if (!structure) structure = new SalaryStructure()

    Object.assign(structure, payload)
    await structure.save()

    return res.status(isCreate ? 201 : 200).json({
      structure: {
        id: String(structure._id),
        name: structure.name,
        staffType: structure.staffType,
        baseSalary: toNumber(structure.baseSalary),
        allowancesTotal: toNumber(structure.allowancesTotal),
        deductionsTotal: toNumber(structure.deductionsTotal),
        active: Boolean(structure.active),
        notes: structure.notes || ''
      }
    })
  } catch (err) {
    next(err)
  }
}

async function listSalaryStaff(req, res, next) {
  try {
    await syncTeacherSalaryStaff()
    const query = String(req.query?.q || '').trim().toLowerCase()
    const staffType = String(req.query?.staffType || '').trim()

    const filter = {}
    if (staffType && ['teacher', 'staff'].includes(staffType)) filter.staffType = staffType

    const rows = await SalaryStaff.find(filter)
      .populate('teacher', 'employeeId designation department salary status')
      .populate('user', 'name username email active role')
      .populate('salaryStructure')
      .sort({ updatedAt: -1 })

    const payload = rows.filter((row) => {
      if (!query) return true
      const haystack = [row.name, row.employeeId, row.designation, row.department, row.staffType, row.teacher?.employeeId, row.user?.name].join(' ').toLowerCase()
      return haystack.includes(query)
    }).map((row) => ({
      id: String(row._id),
      name: row.name,
      employeeId: row.employeeId,
      designation: row.designation,
      department: row.department,
      staffType: row.staffType,
      monthlySalary: toNumber(row.monthlySalary),
      advanceBalance: toNumber(row.advanceBalance),
      status: row.status,
      salaryOnly: Boolean(row.salaryOnly),
      teacher: row.teacher ? {
        id: String(row.teacher._id || row.teacher.id || ''),
        employeeId: row.teacher.employeeId,
        designation: row.teacher.designation,
        department: row.teacher.department,
        salary: toNumber(row.teacher.salary)
      } : null,
      user: row.user ? {
        id: String(row.user._id || row.user.id || ''),
        name: row.user.name,
        username: row.user.username,
        email: row.user.email
      } : null,
      salaryStructure: row.salaryStructure ? {
        id: String(row.salaryStructure._id || row.salaryStructure.id || ''),
        name: row.salaryStructure.name,
        baseSalary: toNumber(row.salaryStructure.baseSalary),
        allowancesTotal: toNumber(row.salaryStructure.allowancesTotal),
        deductionsTotal: toNumber(row.salaryStructure.deductionsTotal)
      } : null
    }))

    return res.json({ staff: payload })
  } catch (err) {
    next(err)
  }
}

async function getSalaryStaff(req, res, next) {
  try {
    await syncTeacherSalaryStaff()
    const row = await SalaryStaff.findById(req.params.id)
      .populate('teacher', 'employeeId designation department salary status')
      .populate('user', 'name username email active role')
      .populate('salaryStructure')

    if (!row) {
      return res.status(404).json({ error: 'Salary staff not found' })
    }

    return res.json({
      staff: {
        id: String(row._id),
        name: row.name,
        employeeId: row.employeeId,
        designation: row.designation,
        department: row.department,
        staffType: row.staffType,
        monthlySalary: toNumber(row.monthlySalary),
        advanceBalance: toNumber(row.advanceBalance),
        status: row.status,
        salaryOnly: Boolean(row.salaryOnly),
        bankName: row.bankName || '',
        bankAccount: row.bankAccount || '',
        notes: row.notes || '',
        teacher: row.teacher ? {
          id: String(row.teacher._id || row.teacher.id || ''),
          employeeId: row.teacher.employeeId,
          designation: row.teacher.designation,
          department: row.teacher.department,
          salary: toNumber(row.teacher.salary)
        } : null,
        user: row.user ? {
          id: String(row.user._id || row.user.id || ''),
          name: row.user.name,
          username: row.user.username,
          email: row.user.email
        } : null,
        salaryStructure: row.salaryStructure ? {
          id: String(row.salaryStructure._id || row.salaryStructure.id || ''),
          name: row.salaryStructure.name,
          baseSalary: toNumber(row.salaryStructure.baseSalary),
          allowancesTotal: toNumber(row.salaryStructure.allowancesTotal),
          deductionsTotal: toNumber(row.salaryStructure.deductionsTotal)
        } : null
      }
    })
  } catch (err) {
    next(err)
  }
}

async function upsertSalaryStaff(req, res, next) {
  try {
    const body = req.body || {}
    const staffId = String(req.params?.id || body.id || '').trim()
    const teacherId = String(body.teacherId || '').trim()

    let staff = staffId ? await SalaryStaff.findById(staffId) : null
    if (!staff && teacherId) {
      staff = await SalaryStaff.findOne({ teacher: teacherId })
    }
    const isCreate = !staff

    const employeeId = String(body.employeeId || '').trim()
    if (!staff) {
      if (!body.name || !employeeId || !body.designation) {
        return res.status(400).json({ error: 'name, employeeId, and designation are required' })
      }
      staff = new SalaryStaff()
    }

    if (teacherId) staff.teacher = teacherId
    if (body.userId !== undefined) staff.user = body.userId || null
    if (body.name !== undefined) staff.name = String(body.name || '').trim()
    if (employeeId) staff.employeeId = employeeId
    if (body.designation !== undefined) staff.designation = String(body.designation || '').trim()
    if (body.department !== undefined) staff.department = String(body.department || '').trim()
    if (body.staffType !== undefined && ['teacher', 'staff'].includes(String(body.staffType))) staff.staffType = String(body.staffType)
    if (body.monthlySalary !== undefined) staff.monthlySalary = toNumber(body.monthlySalary)
    if (body.salaryStructureId !== undefined) staff.salaryStructure = body.salaryStructureId || null
    if (body.salaryOnly !== undefined) staff.salaryOnly = Boolean(body.salaryOnly)
    if (body.advanceBalance !== undefined) staff.advanceBalance = toNumber(body.advanceBalance)
    if (body.status !== undefined && ['active', 'inactive'].includes(String(body.status))) staff.status = String(body.status)
    if (body.bankName !== undefined) staff.bankName = String(body.bankName || '').trim()
    if (body.bankAccount !== undefined) staff.bankAccount = String(body.bankAccount || '').trim()
    if (body.notes !== undefined) staff.notes = String(body.notes || '').trim()

    await staff.save()

    return res.status(isCreate ? 201 : 200).json({
      staff: {
        id: String(staff._id),
        name: staff.name,
        employeeId: staff.employeeId,
        designation: staff.designation,
        department: staff.department,
        staffType: staff.staffType,
        monthlySalary: toNumber(staff.monthlySalary),
        advanceBalance: toNumber(staff.advanceBalance),
        status: staff.status,
        salaryOnly: Boolean(staff.salaryOnly)
      }
    })
  } catch (err) {
    if (err?.code === 11000) return res.status(409).json({ error: 'Salary staff already exists' })
    next(err)
  }
}

async function deleteSalaryStaff(req, res, next) {
  try {
    const deleted = await SalaryStaff.findByIdAndDelete(req.params.id)
    if (!deleted) return res.status(404).json({ error: 'Salary staff not found' })
    return res.json({ ok: true })
  } catch (err) {
    next(err)
  }
}

async function listSalaryRecords(req, res, next) {
  try {
    await syncTeacherSalaryStaff()
    // Default to parsed month (same behaviour as summary) when not provided
    const periodMonth = parseMonth(req.query?.periodMonth)
    const status = String(req.query?.status || '').trim()
    const staffId = String(req.query?.staffId || '').trim()
    const range = String(req.query?.range || '').trim().toLowerCase()
    const query = String(req.query?.q || '').trim().toLowerCase()
    const scope = await resolveSalaryStaffScope(req)

    // Ensure slips exist for this period
    await ensureMonthlySlips({ periodMonth })

    const filter = {}
    if (periodMonth) filter.periodMonth = periodMonth
    if (status) filter.status = status
    if (staffId) filter.staff = staffId
    if (scope !== null) filter.staff = { $in: scope }

    const slips = await SalarySlip.find(filter)
      .populate('staff')
      .populate({ path: 'staff', populate: [{ path: 'teacher', select: 'employeeId designation department salary' }, { path: 'user', select: 'name username email' }] })
      .sort({ periodMonth: -1, createdAt: -1 })

    const rows = slips.map((slip) => {
      const staff = slip.staff || {}
      const hasTeacherName = req.user?.role !== 'Finance'
      return {
        id: String(slip._id),
        staffId: String(staff._id || ''),
        teacherId: String(staff.teacher?._id || ''),
        periodMonth: slip.periodMonth,
        name: hasTeacherName ? String(staff.name || '') : undefined,
        employeeId: hasTeacherName ? String(staff.employeeId || '') : undefined,
        designation: hasTeacherName ? String(staff.designation || '') : undefined,
        department: hasTeacherName ? String(staff.department || '') : undefined,
        baseSalary: toNumber(slip.baseSalary),
        allowancesTotal: toNumber(slip.allowancesTotal),
        deductionsTotal: toNumber(slip.deductionsTotal),
        advanceTotal: toNumber(slip.advanceTotal),
        grossSalary: toNumber(slip.grossSalary),
        netSalary: toNumber(slip.netSalary),
        paidAmount: paymentTotal(slip.payments),
        status: slip.status,
        createdAt: slip.createdAt,
        updatedAt: slip.updatedAt
      }
    })

    const filteredRows = query
      ? rows.filter((row) => {
          const haystack = [row.name, row.employeeId, row.designation, row.department, row.periodMonth, row.status].join(' ').toLowerCase()
          return haystack.includes(query)
        })
      : rows

    return res.json({ records: filteredRows, range, periodMonth })
  } catch (err) {
    next(err)
  }
}

async function generateMonthlySalary(req, res, next) {
  try {
    const result = await ensureMonthlySlips({
      periodMonth: req.body?.periodMonth,
      staffIds: Array.isArray(req.body?.staffIds) ? req.body.staffIds : null
    })
    return res.status(201).json({ ok: true, ...result })
  } catch (err) {
    next(err)
  }
}

async function updateSalaryStatus(req, res, next) {
  try {
    const slip = await SalarySlip.findById(req.params.id)
    if (!slip) return res.status(404).json({ error: 'Salary slip not found' })

    const nextStatus = String(req.body?.status || '').trim().toLowerCase()
    const paidAmount = paymentTotal(slip.payments)

    if (nextStatus === 'paid') {
      const remaining = Math.max(0, toNumber(slip.netSalary) - paidAmount)
      if (remaining > 0) {
        slip.payments.push({ amount: remaining, method: 'cash', note: 'Manual salary status update' })
      }
      slip.status = 'paid'
    } else if (nextStatus === 'partial') {
      slip.status = paidAmount > 0 ? 'partial' : 'pending'
    } else {
      slip.status = 'pending'
    }

    await slip.save()
    return res.json({ slip })
  } catch (err) {
    next(err)
  }
}

async function addAdvancePayment(req, res, next) {
  try {
    const slip = await SalarySlip.findById(req.params.id)
    if (!slip) return res.status(404).json({ error: 'Salary slip not found' })

    const amount = toNumber(req.body?.amount)
    if (!amount) return res.status(400).json({ error: 'Advance amount is required' })

    slip.advanceTotal = toNumber(slip.advanceTotal) + amount
    slip.payments.push({ amount, method: req.body?.method || 'cash', note: req.body?.note || 'Advance payment' })

    const paidAmount = paymentTotal(slip.payments)
    if (paidAmount >= toNumber(slip.netSalary)) slip.status = 'paid'
    else if (paidAmount > 0) slip.status = 'partial'

    await slip.save()
    return res.json({ slip })
  } catch (err) {
    next(err)
  }
}

async function getSalarySlipPdf(req, res, next) {
  try {
    const slip = await SalarySlip.findById(req.params.id).populate({ path: 'staff', populate: [{ path: 'teacher', select: 'employeeId designation department' }, { path: 'user', select: 'name' }] })
    if (!slip) return res.status(404).json({ error: 'Salary slip not found' })

    const scope = await resolveSalaryStaffScope(req)
    if (scope !== null && !scope.some((staffId) => String(staffId) === String(slip.staff?._id || slip.staff))) {
      return res.status(403).json({ error: 'Forbidden' })
    }

    const doc = new PDFDocument({ size: 'A4', margin: 36 })
    res.setHeader('Content-Type', 'application/pdf')
    res.setHeader('Content-Disposition', `attachment; filename="salary-slip-${slip.periodMonth}.pdf"`)

    doc.pipe(res)
    doc.fontSize(18).text('Salary Slip', { align: 'center' })
    doc.moveDown()
    doc.fontSize(12).text(`Period: ${slip.periodMonth}`)
    doc.text(`Staff: ${slip.staff?.name || '—'}`)
    doc.text(`Employee ID: ${slip.staff?.employeeId || '—'}`)
    doc.text(`Designation: ${slip.staff?.designation || '—'}`)
    doc.text(`Base Salary: ${toNumber(slip.baseSalary)}`)
    doc.text(`Allowances: ${toNumber(slip.allowancesTotal)}`)
    doc.text(`Deductions: ${toNumber(slip.deductionsTotal)}`)
    doc.text(`Advance: ${toNumber(slip.advanceTotal)}`)
    doc.text(`Gross Salary: ${toNumber(slip.grossSalary)}`)
    doc.text(`Net Salary: ${toNumber(slip.netSalary)}`)
    doc.text(`Status: ${slip.status}`)
    doc.moveDown()
    doc.text('Payments:')
    slip.payments.forEach((payment, index) => {
      doc.text(`${index + 1}. ${toNumber(payment.amount)} via ${payment.method || 'cash'} on ${(payment.paidAt || new Date()).toISOString().slice(0, 10)}`)
    })
    doc.end()
  } catch (err) {
    next(err)
  }
}

async function getSalaryReports(req, res, next) {
  try {
    await syncTeacherSalaryStaff()
    const periodMonth = req.query?.periodMonth ? parseMonth(req.query.periodMonth) : null
    const scope = await resolveSalaryStaffScope(req)
    const filter = periodMonth ? { periodMonth } : {}
    if (scope !== null) filter.staff = { $in: scope }
    const slips = await SalarySlip.find(filter).populate('staff').sort({ periodMonth: -1, createdAt: -1 })

    const totalPaid = slips.reduce((sum, slip) => sum + paymentTotal(slip.payments), 0)
    const totalNet = slips.reduce((sum, slip) => sum + toNumber(slip.netSalary), 0)
    const totalAdvance = slips.reduce((sum, slip) => sum + toNumber(slip.advanceTotal), 0)
    const rows = slips.map((slip) => ({
      id: String(slip._id),
      periodMonth: slip.periodMonth,
      name: req.user?.role === 'Finance' ? undefined : String(slip.staff?.name || ''),
      employeeId: req.user?.role === 'Finance' ? undefined : String(slip.staff?.employeeId || ''),
      amount: toNumber(slip.netSalary),
      paidAmount: paymentTotal(slip.payments),
      advanceTotal: toNumber(slip.advanceTotal),
      status: slip.status,
      createdAt: slip.createdAt
    }))

    return res.json({
      periodMonth,
      totals: { totalPaid, totalNet, totalAdvance, slipCount: slips.length },
      rows
    })
  } catch (err) {
    next(err)
  }
}

module.exports = {
  syncTeacherSalaryStaff,
  ensureMonthlySlips,
  getSalarySummary,
  listSalaryStructures,
  upsertSalaryStructure,
  listSalaryStaff,
  getSalaryStaff,
  upsertSalaryStaff,
  deleteSalaryStaff,
  listSalaryRecords,
  generateMonthlySalary,
  updateSalaryStatus,
  addAdvancePayment,
  getSalarySlipPdf,
  getSalaryReports
}