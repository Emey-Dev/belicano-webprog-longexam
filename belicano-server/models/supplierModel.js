const mongoose = require("mongoose");

const supplierSchema = new mongoose.Schema(
  {
    supplierName: { type: String, required: true, trim: true, unique: true },
    supplierEmail: { type: String, trim: true, lowercase: true, default: "" },
    supplierPhone: { type: String, trim: true, default: "" },
    supplierAddress: { type: String, trim: true, default: "" },
  },
  { timestamps: true, collection: "suppliers" },
);

module.exports = mongoose.model("Supplier", supplierSchema);
