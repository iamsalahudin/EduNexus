const mongoose = require('mongoose')

const SalaryStructureSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    staffType: { type: String, enum: ['teacher', 'staff', 'all'], default: 'all' },
    baseSalary: { type: Number, default: 0, min: 0 },
    allowancesTotal: { type: Number, default: 0, min: 0 },
    deductionsTotal: { type: Number, default: 0, min: 0 },
    active: { type: Boolean, default: true },
    notes: { type: String, trim: true }
  },
  { timestamps: true }
)

SalaryStructureSchema.index({ active: 1, staffType: 1 })

module.exports = mongoose.model('SalaryStructure', SalaryStructureSchema)