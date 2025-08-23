const mongoose = require('mongoose');

const RoleSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true, unique: true },
    usersCount: { type: Number, required: true, default: 0, min: 0 },
    department: { type: String, required: true, trim: true },
  },
  { timestamps: true }
);

module.exports = mongoose.models.Role || mongoose.model('Role', RoleSchema);
