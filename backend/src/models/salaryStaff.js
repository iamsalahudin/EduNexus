const mongoose = require('mongoose')

const SalaryStaffSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null, index: true },
    teacher: { type: mongoose.Schema.Types.ObjectId, ref: 'Teacher', default: null, index: true },
    staffType: { type: String, enum: ['teacher', 'staff'], default: 'staff' },
    name: { type: String, required: true, trim: true },
    employeeId: { type: String, required: true, trim: true, unique: true },
    designation: { type: String, required: true, trim: true },
    department: { type: String, trim: true },
    monthlySalary: { type: Number, default: 0, min: 0 },
    salaryStructure: { type: mongoose.Schema.Types.ObjectId, ref: 'SalaryStructure', default: null },
    salaryOnly: { type: Boolean, default: false },
    advanceBalance: { type: Number, default: 0, min: 0 },
    status: { type: String, enum: ['active', 'inactive'], default: 'active' },
    bankName: { type: String, trim: true },
    bankAccount: { type: String, trim: true },
    notes: { type: String, trim: true }
  },
  { timestamps: true }
)

SalaryStaffSchema.index({ teacher: 1 }, { unique: true, sparse: true })
SalaryStaffSchema.index({ user: 1 }, { unique: true, sparse: true })
SalaryStaffSchema.index({ staffType: 1, status: 1 })

module.exports = mongoose.model('SalaryStaff', SalaryStaffSchema)