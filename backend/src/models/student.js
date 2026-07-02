const mongoose = require('mongoose');

const StudentSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    studentId: { type: String, required: true, unique: true },
    registrationNumber: { type: String, required: true, unique: true, index: true },
    rollNumber: { type: String },
    class: { type: String, required: true, index: true },
    section: { type: String, index: true },
    dob: { type: Date },
    parents: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    contact: { type: String, required: true },
    address: { type: String },
    enrollDate: { type: Date },
    profilePicture: { type: String },
    documents: [{ type: String }],
    tutionFeeConcession: { type: Number },
    lastFeePaid: { type: Boolean, default: false },
    lastFeePaidAmount: { type: Number, default: 0 },
    lastFeePaidOn: { type: Date },
    availTransport: { type: Boolean, default: false },
    transportFeeConcession: { type: Number },
    balance: { type: Number, default: 0 },
    bloodGroup: { type: String },
    gender: { type: String, enum: ['Male', 'Female'] },
    healthConditions: { type: String },
    status: { type: String, enum: ['incampus', 'alumni'], default: 'incampus' },
    notes: { type: String }
  },
  { timestamps: true }
);

module.exports = mongoose.model('Student', StudentSchema);
