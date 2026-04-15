const mongoose = require('mongoose');

const teacherSchema = new mongoose.Schema({
  user: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User', 
    required: true 
  },

  employeeId: { type: String, required: true, unique: true },
  designation: { type: String, required: true }, 
  department: { type: String },

  subjects: [{ type: String }],
  classesAssigned: [{ type: String }], 
  qualification: { type: String, required: true },
  certifications: [{ type: String }],

  joiningDate: { type: Date, required: true },
  experienceYears: { type: Number, default: 0 },

  salary: { type: Number },

  contactNumber: { type: String, required: true },
  address: { type: String, required: true },

  emergencyContact: {
    name: { type: String },
    phone: { type: String }
  },
  status: {
    type: String,
    enum: ['Working', 'Resigned'],
    default: 'Working'
  },
  ifleave:{
    StartDate: { type: Date },
    EndDate: { type: Date },
    Reason: { type: String }
  },
  documents: [{ type: String }],
  notes: { type: String }

}, { timestamps: true });

teacherSchema.index({ user: 1 }, { unique: true });
teacherSchema.index({ employeeId: 1 }, { unique: true });
teacherSchema.index({ status: 1 });
teacherSchema.index({ updatedAt: -1 });

module.exports = mongoose.model('Teacher', teacherSchema);