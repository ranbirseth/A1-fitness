const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const userSchema = new mongoose.Schema(
  {
    gymId: { type: String, required: true, index: true }, // Multi-tenant ID
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, lowercase: true, trim: true },
    phone: { type: String, trim: true },
    password: { type: String, required: true, minlength: 6 },
    role: { type: String, enum: ["superadmin", "admin", "trainer", "member"], default: "member", index: true },
    photo: String,
    status: { type: String, enum: ["pending", "active", "inactive"], default: "active", index: true },
    specialty: { type: String, trim: true },
    address: { type: String, trim: true },
    emergencyContact: { type: String, trim: true },
    refreshTokens: [{ type: String }],
    resetPasswordToken: { type: String },
    resetPasswordExpire: { type: Date }
  },
  { timestamps: true }
);

userSchema.index({ gymId: 1, email: 1 }, { unique: true });

userSchema.pre("save", async function preSave(next) {
  if (!this.isModified("password")) return next();
  this.password = await bcrypt.hash(this.password, 10);
  next();
});

userSchema.methods.comparePassword = function comparePassword(input) {
  return bcrypt.compare(input, this.password);
};

module.exports = mongoose.model("User", userSchema);
