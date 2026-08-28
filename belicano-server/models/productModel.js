const mongoose = require("mongoose");

const productSchema = new mongoose.Schema(
  {
    productName: { type: String, required: true, trim: true },
    productSlug: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
      unique: true,
    },
    productDescription: { type: String, required: true, trim: true },
    productPrice: { type: Number, required: true, min: 0 },
    categoryId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Category",
      required: true,
    },
    supplierId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Supplier",
      default: null,
    },
    productImage: { type: String, trim: true, default: "" },
    stockQuantity: { type: Number, required: true, min: 0, default: 0 },
    stockStatus: {
      type: String,
      enum: ["In stock", "Low stock", "Out of stock", "Preorder"],
      default: "In stock",
    },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true, collection: "products" },
);

productSchema.index({ categoryId: 1, createdAt: -1 });
productSchema.index({ supplierId: 1, createdAt: -1 });
productSchema.index({ productName: "text", productDescription: "text" });

module.exports = mongoose.model("Product", productSchema);
