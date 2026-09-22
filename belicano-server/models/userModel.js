const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const { SALT } = require("../config/config");

const userSchema = new mongoose.Schema(
  {
    firstName: { type: String, required: true, trim: true },
    lastName: { type: String, required: true, trim: true },
    email: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
      unique: true,
    },
    contactNumber: { type: String, trim: true, default: "" },
    address: { type: String, trim: true, default: "" },
    passwordHash: { type: String, required: true, select: false },
    userRole: {
      type: String,
      enum: ["customer", "admin", "supplier"],
      default: "customer",
    },
    supplierId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Supplier",
      default: null,
    },
    isActive: { type: Boolean, default: true },
    sessionVersion: { type: Number, default: 0 },
  },
  { timestamps: true, collection: "users" },
);

userSchema.pre("save", async function hashPassword(next) {
  if (this.userRole === "supplier" && !this.supplierId)
    return next(
      new Error("A supplier account must be linked to a supplier record."),
    );
  if (!this.isModified("passwordHash")) return next();
  this.passwordHash = await bcrypt.hash(this.passwordHash, SALT);
  next();
});

userSchema.methods.comparePassword = function comparePassword(password) {
  return bcrypt.compare(password, this.passwordHash);
};

userSchema.index({ supplierId: 1 });

module.exports = mongoose.model("User", userSchema);
