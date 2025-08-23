const mongoose = require('mongoose')

const PermissionSchema = new mongoose.Schema(
  {
    roleId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Role',
      required: true,
      unique: true,
      index: true,
    },
    roleName: { type: String, required: true },
    adGroups: { type: [String], default: [] },
  },
  { timestamps: true }
)

module.exports = mongoose.models.Permission || mongoose.model('Permission', PermissionSchema)
