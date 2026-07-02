const mongoose = require('mongoose')

const SalaryPaymentSchema = new mongoose.Schema(
  {
    amount: { type: Number, required: true, min: 0 },
    method: { type: String, default: 'cash', trim: true },
    note: { type: String, trim: true },
    paidAt: { type: Date, default: Date.now }
  },
  { _id: false }
)

const SalarySlipSchema = new mongoose.Schema(
  {
    staff: { type: mongoose.Schema.Types.ObjectId, ref: 'SalaryStaff', required: true, index: true },
    teacher: { type: mongoose.Schema.Types.ObjectId, ref: 'Teacher', default: null, index: true },
    periodMonth: { type: String, required: true, trim: true, index: true },
    baseSalary: { type: Number, default: 0, min: 0 },
    allowancesTotal: { type: Number, default: 0, min: 0 },
    deductionsTotal: { type: Number, default: 0, min: 0 },
    advanceTotal: { type: Number, default: 0, min: 0 },
    grossSalary: { type: Number, default: 0, min: 0 },
    netSalary: { type: Number, default: 0, min: 0 },
    status: { type: String, enum: ['pending', 'partial', 'paid'], default: 'pending', index: true },
    payments: { type: [SalaryPaymentSchema], default: [] },
    generatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    notes: { type: String, trim: true }
  },
  { timestamps: true }
)

SalarySlipSchema.index({ staff: 1, periodMonth: 1 }, { unique: true })
SalarySlipSchema.index({ periodMonth: -1, status: 1 })

module.exports = mongoose.model('SalarySlip', SalarySlipSchema)