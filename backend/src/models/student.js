const mongoose = require('mongoose');

const StudentSchema = new mongoose.Schema(
  {
    studentId: { type: String, required: true, unique: true },
    firstName: { type: String, required: true },
    lastName: { type: String },
    class: { type: String, required: true, index: true },
    section: { type: String, index: true },
    dob: { type: Date },
    parents: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    contact: { type: String },
    address: { type: String },
    enrollDate: { type: Date },
    status: { type: String, enum: ['active', 'inactive', 'alumni'], default: 'active' }
  },
  { timestamps: true }
);

module.exports = mongoose.model('Student', StudentSchema);
