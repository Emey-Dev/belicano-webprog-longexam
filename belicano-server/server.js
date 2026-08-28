const express = require("express");
const cors = require("cors");
const connectDB = require("./config/db");
const { PORT } = require("./config/config");
const { HttpStatus } = require("./config/constants");
const Product = require("./models/productModel");
const Order = require("./models/orderModel");
const Review = require("./models/reviewModel");
const User = require("./models/userModel");

const app = express();
app.use(cors());
app.use(express.json());

app.get("/", (_req, res) => res.json({ message: "BulldogEx API is running." }));
const productRoutes = require("./routes/productRoutes");
app.use("/api/products", productRoutes);
app.use("/api/product", productRoutes);
app.use("/api/category", require("./routes/categoryRoutes"));
app.use("/api/cart", require("./routes/cartRoutes"));
app.use("/api/order", require("./routes/orderRoutes"));
app.use("/api/review", require("./routes/reviewRoutes"));
app.use("/api/user", require("./routes/userRoutes"));
app.get("/api/stats", async (_req, res) => {
  try {
    const [products, reviewedItems, activeUsers, orderedItems, sales] = await Promise.all([
      Product.countDocuments({ $or: [{ isActive: true }, { isActive: { $exists: false } }] }),
      Review.countDocuments(),
      User.countDocuments({ isActive: true }),
      Order.aggregate([
        { $match: { orderStatus: { $ne: "Cancelled" } } },
        { $unwind: "$orderItems" },
        { $group: { _id: null, total: { $sum: "$orderItems.quantity" } } },
      ]),
      Order.aggregate([
        { $match: { orderStatus: { $ne: "Cancelled" } } },
        { $unwind: "$orderItems" },
        { $group: { _id: null, total: { $sum: { $multiply: ["$orderItems.productPrice", "$orderItems.quantity"] } } } },
      ]),
    ]);
    res.json({ products, orderedItems: orderedItems[0]?.total || 0, reviewedItems, activeUsers, totalSales: sales[0]?.total || 0 });
  } catch (_error) {
    res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({ message: "Unable to load store statistics." });
  }
});

app.use("/api/v1/product", productRoutes);
app.use("/api/v1/products", productRoutes);
const supplierRoutes = require("./routes/supplierRoutes");
app.use("/api/suppliers", supplierRoutes);
app.use("/api/supplier", supplierRoutes);
app.use("/api/v1/suppliers", supplierRoutes);
app.use("/api/v1/supplier", supplierRoutes);

app.use((err, _req, res, _next) => {
  console.error(err);
  res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
    message: "Internal server error.",
  });
});

connectDB()
  .then(() =>
    app.listen(PORT, () => console.log(`Server running on port ${PORT}`)),
  )
  .catch((error) => {
    console.error(`Database connection failed: ${error.message}`);
    process.exit(1);
  });
