import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import Pagination from "../../components/Pagination.jsx";
import { paginate } from "../../utils/pagination.js";
import { authHeaders, useAuth } from "../../context/useAuth.js";
import { apiUrl } from "../../config/api.js";

const tabs = ["Overview", "Products", "Orders", "Reviews", "Categories", "Users"];
const blank = {
  productName: "",
  productSlug: "",
  productDescription: "",
  productPrice: "",
  stockQuantity: "",
  stockStatus: "In stock",
  isActive: true,
  productImage: "",
  categoryId: "",
  supplierId: "",
};
const input =
  "w-full rounded-xl border border-zinc-300 bg-white px-3 py-2 text-sm outline-none focus:border-blue-950 focus:ring-2 focus:ring-yellow-300";
const selectInput = `${input} cursor-pointer appearance-none border-blue-200 bg-blue-50`;
const emptyUserForm = {
  firstName: "",
  lastName: "",
  email: "",
  contactNumber: "",
  address: "",
  userRole: "customer",
  supplierId: "",
  isActive: true,
};
const orderStatusClasses = {
  Pending: "bg-yellow-100 text-yellow-900",
  Processing: "bg-blue-100 text-blue-900",
  "Ready for pickup": "bg-green-100 text-green-900",
  Completed: "bg-zinc-200 text-zinc-800",
  Cancelled: "bg-red-100 text-red-900",
};

export default function AdminPage() {
  const { user, token } = useAuth();
  const navigate = useNavigate();
  const headers = useMemo(() => authHeaders(token), [token]);
  const [tab, setTab] = useState("Overview");
  const [products, setProducts] = useState([]);
  const [orders, setOrders] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [users, setUsers] = useState([]);
  const [categories, setCategories] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [totalSales, setTotalSales] = useState(0);
  const [form, setForm] = useState(blank);
  const [editId, setEditId] = useState("");
  const [message, setMessage] = useState("");
  const [productPage, setProductPage] = useState(1);
  const [orderPage, setOrderPage] = useState(1);
  const [reviewPage, setReviewPage] = useState(1);
  const [userPage, setUserPage] = useState(1);
  const [showInactiveProducts, setShowInactiveProducts] = useState(false);
  const [pendingOrderConfirmation, setPendingOrderConfirmation] = useState(null);
  const [productSearch, setProductSearch] = useState("");
  const [orderSearch, setOrderSearch] = useState("");
  const [reviewSearch, setReviewSearch] = useState("");
  const [userSearch, setUserSearch] = useState("");
  const [expandedCategories, setExpandedCategories] = useState([]);
  const [editingUser, setEditingUser] = useState(null);
  const [userForm, setUserForm] = useState(emptyUserForm);
  const [deactivatingUser, setDeactivatingUser] = useState(null);
  const editingReviewRef = useRef(null);
  const changeTab = (nextTab) => {
    setTab(nextTab);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };
  const salesBySupplier = suppliers.map((supplier) => ({
    ...supplier,
    total: orders
      .filter((order) => order.orderStatus !== "Cancelled")
      .flatMap((order) => order.orderItems || [])
      .filter((item) => products.some((product) => String(product._id) === String(item.productId) && String(product.supplierId?._id || product.supplierId) === String(supplier._id)))
      .reduce((sum, item) => sum + item.productPrice * item.quantity, 0),
  }));
  const toggleCategory = (categoryId) => {
    const id = String(categoryId);
    setExpandedCategories((current) =>
      current.includes(id) ? current.filter((item) => item !== id) : [...current, id],
    );
  };
  const supplierName = (product) =>
    product.supplierId?.supplierName ||
    suppliers.find((supplier) => String(supplier._id) === String(product.supplierId?._id || product.supplierId))?.supplierName ||
    "No supplier assigned";
  const load = useCallback(async () => {
    try {
      const results = await Promise.all([
        fetch(apiUrl("products/admin"), { headers }),
        fetch(apiUrl("order"), { headers }),
        fetch(apiUrl("review")),
        fetch(apiUrl("user"), { headers }),
        fetch(apiUrl("category")),
        fetch(apiUrl("v1/suppliers")),
        fetch(apiUrl("stats")),
      ]);
      if (!results[1].ok || !results[3].ok) throw Error();
      const data = await Promise.all(results.map((r) => r.json()));
      setProducts(data[0]);
      setOrders(data[1]);
      if (!editingReviewRef.current) setReviews(data[2]);
      setUsers(data[3]);
      setCategories(data[4]);
      setSuppliers(data[5].data || data[5]);
      setTotalSales(data[6].totalSales || 0);
    } catch {
      navigate("/");
    }
  }, [headers, navigate]);
  useEffect(() => {
    if (!user || user.userRole !== "admin") navigate("/");
    else {
      void load();
      const refresh = window.setInterval(() => {
        if (!editingReviewRef.current) void load();
      }, 5000);
      return () => window.clearInterval(refresh);
    }
  }, [user, navigate, load]);
  const flash = (value) => {
    setMessage(value);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };
  useEffect(() => {
    if (!message) return undefined;
    const timer = window.setTimeout(() => setMessage(""), 3500);
    return () => window.clearTimeout(timer);
  }, [message]);
  const api = async (url, method, body) => {
    const response = await fetch(apiUrl(url), {
      method,
      headers,
      body: JSON.stringify(body),
    });
    const data = await response.json();
    if (!response.ok) throw Error(data.message);
    return data;
  };
  const saveProduct = async (event) => {
    event.preventDefault();
    try {
      await api(
        editId ? `products/${editId}` : "products",
        editId ? "PUT" : "POST",
        {
          ...form,
          productPrice: Number(form.productPrice),
          stockQuantity: Number(form.stockQuantity),
        },
      );
      flash(editId ? "Product updated." : "Product created.");
      setForm(blank);
      setEditId("");
      load();
    } catch (error) {
      flash(error.message || "Unable to save product.");
    }
  };
  const updateOrder = async (order, orderStatus) => {
    try {
      await api(`order/${order._id}`, "PUT", { orderStatus });
      flash("Order status updated.");
      load();
    } catch {
      flash("Unable to update order.");
    }
  };
  const updateUser = async (account, changes) => {
    try {
      await api(`user/${account._id}/admin`, "PUT", changes);
      flash("User updated.");
      load();
    } catch {
      flash("Unable to update user.");
    }
  };
  const openUserEditor = (account) => {
    setEditingUser(account);
    setUserForm({
      firstName: account.firstName || "",
      lastName: account.lastName || "",
      email: account.email || "",
      contactNumber: account.contactNumber || "",
      address: account.address || "",
      userRole: account.userRole || "customer",
      supplierId: account.supplierId?._id || account.supplierId || "",
      isActive: account.isActive !== false,
    });
  };
  const saveUser = async (event) => {
    event.preventDefault();
    try {
      await api(`user/${editingUser._id}/admin`, "PUT", {
        ...userForm,
        supplierId: userForm.userRole === "supplier" ? userForm.supplierId : null,
      });
      setEditingUser(null);
      flash("User details updated.");
      load();
    } catch (error) {
      flash(error.message || "Unable to update user.");
    }
  };
  const updateReview = async (review) => {
    try {
      await api(`review/${review._id}`, "PUT", {
        reviewRating: review.reviewRating,
        reviewComment: review.reviewComment,
      });
      flash("Review updated.");
      editingReviewRef.current = null;
      load();
    } catch {
      flash("Unable to update review.");
    }
  };
  const updateProductStatus = async (product) => {
    try {
      await api(`products/${product._id}`, "PUT", { isActive: product.isActive === false });
      flash(product.isActive === false ? "Product enabled." : "Product disabled.");
      load();
    } catch {
      flash("Unable to update product visibility.");
    }
  };
  const matchesSearch = (value, search) =>
    String(value || "").toLowerCase().includes(search.trim().toLowerCase());
  const visibleProducts = products.filter((item) =>
    (showInactiveProducts ? item.isActive === false : item.isActive !== false) &&
    matchesSearch(`${item.productName} ${item.productSlug}`, productSearch),
  );
  const visibleOrders = orders.filter((order) =>
    matchesSearch(
      `${order._id} ${order.userId?.firstName} ${order.userId?.lastName} ${order.userId?.email} ${order.orderItems?.map((item) => item.productName).join(" ")}`,
      orderSearch,
    ),
  );
  const visibleReviews = reviews.filter((review) =>
    matchesSearch(
      `${review.userId?.firstName} ${review.userId?.lastName} ${review.reviewComment} ${review.reviewRating}`,
      reviewSearch,
    ),
  );
  const visibleUsers = users.filter((account) =>
    matchesSearch(
      `${account.firstName} ${account.lastName} ${account.email} ${account.userRole}`,
      userSearch,
    ),
  );
  const pagedProducts = paginate(visibleProducts, productPage);
  const pagedOrders = paginate(visibleOrders, orderPage);
  const pagedReviews = paginate(visibleReviews, reviewPage);
  const pagedUsers = paginate(visibleUsers, userPage);
  const userCounts = {
    admin: users.filter((account) => account.userRole === "admin").length,
    customer: users.filter((account) => account.userRole === "customer").length,
    supplier: users.filter((account) => account.userRole === "supplier").length,
    active: users.filter((account) => account.isActive !== false).length,
    inactive: users.filter((account) => account.isActive === false).length,
  };
  const card = (value, label, compact = false) => (
    <article className={`rounded-3xl border-2 border-zinc-900 bg-zinc-50 ${compact ? "p-4" : "p-5"}`}>
      <p className={`${compact ? "text-2xl" : "text-3xl"} font-bold text-blue-950`}>{value}</p>
      <p className={`${compact ? "mt-1" : "mt-2"} text-[11px] font-semibold uppercase tracking-[0.2em] text-zinc-500`}>
        {label}
      </p>
    </article>
  );
  return (
    <div className="min-h-screen bg-zinc-100 px-4 py-8 sm:px-6">
      <main className="mx-auto max-w-7xl">
        <section className="rounded-3xl border-2 border-zinc-900 bg-blue-950 p-6 text-white sm:p-8">
          <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-yellow-400">
                Administration
              </p>
              <h1 className="mt-2 text-3xl font-bold sm:text-4xl">
                BulldogEx control center
              </h1>
              <p className="mt-3 max-w-xl text-sm text-blue-100">
                Manage the catalog, customer orders, feedback, and access from
                one clear workspace.
              </p>
            </div>
            <Link
              to="/products"
              className="rounded-full border-2 border-yellow-400 px-4 py-2 text-center text-xs font-bold uppercase tracking-wider text-yellow-300"
            >
              Browse storefront
            </Link>
          </div>
        </section>
        {message && (
          <p className="fixed right-5 top-5 z-50 max-w-sm rounded-xl border border-blue-200 bg-blue-50 p-3 text-sm text-blue-950 shadow-lg">
            {message}
          </p>
        )}
        <nav className="mt-6 flex gap-2 overflow-x-auto border-b-2 border-zinc-900 pb-3">
          {tabs.map((name) => (
            <button
              key={name}
              onClick={() => changeTab(name)}
              className={`cursor-pointer whitespace-nowrap rounded-full px-4 py-2 text-xs font-bold uppercase tracking-wider ${tab === name ? "bg-yellow-400 text-blue-950" : "bg-white text-zinc-700"}`}
            >
              {name}
            </button>
          ))}
        </nav>
        {tab === "Overview" && (
          <section className="mt-6">
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {card(products.length, "Products")}
              {card(orders.length, "Orders")}
              {card(reviews.length, "Reviews")}
              {card(
                users.filter((item) => item.isActive).length,
                "Active users",
              )}
            </div>
            <article className="mt-6 rounded-3xl border-2 border-zinc-900 bg-white p-6">
              <h2 className="text-xl font-bold">Admin workflow</h2>
              <p className="mt-2 text-sm text-zinc-600">
                Create or update products, confirm and prepare orders for
                pickup, moderate reviews, and manage user status and roles.
              </p>
            </article>
            <article className="mt-6 rounded-3xl border-2 border-zinc-900 bg-white p-6">
              <div className="flex items-start justify-between gap-4">
                <div><p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-zinc-500">Sales overview</p><h2 className="mt-2 text-3xl font-bold text-blue-950">PHP {totalSales.toLocaleString()}</h2><p className="mt-1 text-sm text-zinc-600">Total sales across all non-cancelled orders.</p></div>
              </div>
              <div className="mt-5 grid gap-3 sm:grid-cols-2">
                {salesBySupplier.map((supplier) => <div key={supplier._id} className="flex justify-between rounded-xl border border-zinc-300 p-3 text-sm"><span>{supplier.supplierName}</span><span className="font-bold">PHP {supplier.total.toLocaleString()}</span></div>)}
              </div>
            </article>
          </section>
        )}
        {tab === "Products" && (
          <section className="mt-6 grid gap-6 lg:grid-cols-[.9fr_1.1fr]">
            <form
              onSubmit={saveProduct}
              className="rounded-3xl border-2 border-zinc-900 bg-white p-5"
            >
              <div className="flex justify-between">
                <h2 className="text-xl font-bold">
                  {editId ? "Edit product" : "Create product"}
                </h2>
                {editId && (
                  <button
                    type="button"
                    onClick={() => {
                      setEditId("");
                      setForm(blank);
                    }}
                    className="text-sm underline"
                  >
                    Cancel
                  </button>
                )}
              </div>
              <div className="mt-4 grid gap-3">
                <label className="grid gap-1 text-sm font-semibold text-zinc-700">
                  Product name
                  <input
                    className={input}
                    placeholder="Enter product name"
                    value={form.productName}
                    onChange={(e) =>
                      setForm({ ...form, productName: e.target.value })
                    }
                    required
                  />
                </label>
                <label className="grid gap-1 text-sm font-semibold text-zinc-700">
                  URL slug
                  <input
                    className={input}
                    placeholder="example-product-name"
                    value={form.productSlug}
                    onChange={(e) =>
                      setForm({ ...form, productSlug: e.target.value })
                    }
                    required
                  />
                </label>
                <label className="grid gap-1 text-sm font-semibold text-zinc-700">
                  Product description
                  <textarea
                    className={input}
                    placeholder="Describe the product"
                    value={form.productDescription}
                    onChange={(e) =>
                      setForm({ ...form, productDescription: e.target.value })
                    }
                    required
                  />
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <label className="grid gap-1 text-sm font-semibold text-zinc-700">
                    Price
                    <input
                      className={input}
                      type="number"
                      min="0"
                      placeholder="0"
                      value={form.productPrice}
                      onChange={(e) =>
                        setForm({ ...form, productPrice: e.target.value })
                      }
                      required
                    />
                  </label>
                  <label className="grid gap-1 text-sm font-semibold text-zinc-700">
                    Stock quantity
                    <input
                      className={input}
                      type="number"
                      min="0"
                      placeholder="0"
                      value={form.stockQuantity}
                      onChange={(e) =>
                        setForm({ ...form, stockQuantity: e.target.value })
                      }
                      required
                    />
                  </label>
                </div>
                <label className="grid gap-1 text-sm font-semibold text-zinc-700">
                  Product image filename
                  <input
                    className={input}
                    placeholder="product-image.jpg"
                    value={form.productImage}
                    onChange={(e) =>
                      setForm({ ...form, productImage: e.target.value })
                    }
                  />
                </label>
                <label className="grid gap-1 text-sm font-semibold text-zinc-700">
                  Category
                  <select
                    className={selectInput}
                    value={form.categoryId}
                    onChange={(e) =>
                      setForm({ ...form, categoryId: e.target.value })
                    }
                    required
                  >
                    <option value="">Select category</option>
                    {categories.map((item) => (
                      <option value={item._id} key={item._id}>
                        {item.categoryName}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="grid gap-1 text-sm font-semibold text-zinc-700">
                  Supplier
                  <select
                    className={selectInput}
                    value={form.supplierId}
                    onChange={(e) =>
                      setForm({ ...form, supplierId: e.target.value })
                    }
                    required
                  >
                    <option value="">Select supplier</option>
                    {suppliers.map((item) => (
                      <option value={item._id} key={item._id}>
                        {item.supplierName}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="grid gap-1 text-sm font-semibold text-zinc-700">
                  Stock status
                  <select
                    className={selectInput}
                    value={form.stockStatus}
                    onChange={(e) =>
                      setForm({ ...form, stockStatus: e.target.value })
                    }
                  >
                    {["In stock", "Low stock", "Out of stock", "Preorder"].map(
                      (item) => (
                        <option key={item}>{item}</option>
                      ),
                    )}
                  </select>
                </label>
                <button className="cursor-pointer rounded-full bg-blue-950 px-4 py-3 text-xs font-bold uppercase tracking-wider text-white transition hover:bg-black hover:shadow-lg">
                  {editId ? "Save changes" : "Create product"}
                </button>
              </div>
            </form>
            <div className="space-y-3">
              <input
                value={productSearch}
                onChange={(e) => { setProductSearch(e.target.value); setProductPage(1); }}
                className={input}
                placeholder="Search products by name or slug"
                aria-label="Search products by name or slug"
              />
              <div className="flex items-center justify-between gap-3 border-b-2 border-zinc-900 pb-3">
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-zinc-500">
                    Catalog visibility
                  </p>
                  <p className="mt-1 text-sm text-zinc-600">
                    {showInactiveProducts ? "Showing disabled products only." : "Showing active products only."}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => { setShowInactiveProducts(!showInactiveProducts); setProductPage(1); }}
                  className="cursor-pointer rounded-full border-2 border-blue-950 px-3 py-2 text-xs font-bold uppercase tracking-wider text-blue-950"
                >
                  {showInactiveProducts ? "Show active" : "Show disabled"}
                </button>
              </div>
              {pagedProducts.items.map((item) => (
                <article
                  key={item._id}
                  className={`flex items-center justify-between gap-4 rounded-2xl border-2 border-zinc-900 p-4 ${item.isActive === false ? "bg-zinc-200" : "bg-white"}`}
                >
                  <div>
                    <h3 className="font-bold">{item.productName}</h3>
                    <p className="text-sm text-zinc-600">
                      PHP {item.productPrice} · {item.stockQuantity} available
                    </p>
                    <p className="mt-1 text-xs font-bold uppercase tracking-wider text-zinc-500">
                      {item.isActive === false ? "Disabled" : "Active"}
                    </p>
                  </div>
                  <div className="flex flex-wrap justify-end gap-2">
                    <button
                      onClick={() => {
                        setEditId(item._id);
                        setForm({
                          ...blank,
                          ...item,
                          categoryId: item.categoryId?._id || item.categoryId,
                          supplierId: item.supplierId?._id || item.supplierId,
                        });
                      }}
                      className="cursor-pointer rounded-full border-2 border-blue-950 px-4 py-2 text-xs font-bold uppercase"
                    >
                      Edit
                    </button>
                    <button
                      type="button"
                      onClick={() => updateProductStatus(item)}
                      className="cursor-pointer rounded-full border-2 border-zinc-900 px-3 py-2 text-xs font-bold uppercase"
                    >
                      {item.isActive === false ? "Enable" : "Disable"}
                    </button>
                  </div>
                </article>
              ))}
              <Pagination
                page={pagedProducts.current}
                pageCount={pagedProducts.pageCount}
                onPageChange={setProductPage}
              />
            </div>
          </section>
        )}
        {tab === "Orders" && (
          <section className="mt-6 space-y-3">
            <input
              value={orderSearch}
              onChange={(e) => { setOrderSearch(e.target.value); setOrderPage(1); }}
              className={input}
              placeholder="Search orders by customer, item, or order ID"
              aria-label="Search orders by customer, item, or order ID"
            />
            {pagedOrders.items.map((order) => (
              <article
                key={order._id}
                className="rounded-2xl border-2 border-zinc-900 bg-white p-5"
              >
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <h3 className="font-bold">
                      {order.userId?.firstName} {order.userId?.lastName}
                    </h3>
                    <p className="text-sm text-zinc-600">
                      {order.userId?.email} · PHP {order.totalAmount}
                    </p>
                    <p className="mt-1 text-xs text-zinc-500">
                      Contact: {order.userId?.contactNumber || "Not provided"} · Address: {order.userId?.address || "Not provided"}
                    </p>
                  </div>
                  {["Completed", "Cancelled"].includes(order.orderStatus) ? (
                    <span
                      className={`w-fit rounded-full px-3 py-1 text-xs font-bold ${orderStatusClasses[order.orderStatus]}`}
                    >
                      {order.orderStatus}
                    </span>
                  ) : order.orderStatus === "Pending" ? (
                    <div className="flex flex-wrap items-center justify-end gap-2">
                      <span className={`w-fit rounded-full px-3 py-1 text-xs font-bold ${orderStatusClasses[order.orderStatus]}`}>
                        {order.orderStatus}
                      </span>
                      <button
                        type="button"
                        onClick={() => setPendingOrderConfirmation(order)}
                        className="rounded-full bg-blue-950 px-4 py-2 text-xs font-bold uppercase tracking-wider text-white"
                      >
                        Confirm order
                      </button>
                      <button
                        type="button"
                        onClick={() => updateOrder(order, "Cancelled")}
                        className="rounded-full border-2 border-red-700 px-4 py-2 text-xs font-bold uppercase tracking-wider text-red-700"
                      >
                        Cancel
                      </button>
                    </div>
                  ) : (
                    <select
                      className={`${selectInput} sm:max-w-52`}
                      value={order.orderStatus}
                      onChange={(e) => updateOrder(order, e.target.value)}
                    >
                      {["Pending", "Processing", "Ready for pickup", "Completed", "Cancelled"].map(
                        (item) => {
                          const disabled =
                            item === "Pending" ||
                            item === order.orderStatus ||
                            (order.orderStatus === "Processing" && item === "Completed") ||
                            (order.orderStatus === "Ready for pickup" &&
                              ["Processing", "Pending"].includes(item));
                          return (
                            <option key={item} disabled={disabled}>
                              {item}
                            </option>
                          );
                        },
                      )}
                    </select>
                  )}
                </div>
                <p className="mt-3 text-sm text-zinc-600">
                  {order.orderItems
                    .map((item) => `${item.productName} × ${item.quantity}`)
                    .join(", ")}
                </p>
              </article>
            ))}
            <Pagination
              page={pagedOrders.current}
              pageCount={pagedOrders.pageCount}
              onPageChange={setOrderPage}
            />
          </section>
        )}
        {tab === "Reviews" && (
          <section className="mt-6 space-y-3">
            <input
              value={reviewSearch}
              onChange={(e) => { setReviewSearch(e.target.value); setReviewPage(1); }}
              className={input}
              placeholder="Search reviews by customer, rating, or comment"
              aria-label="Search reviews by customer, rating, or comment"
            />
            {pagedReviews.items.map((review) => (
              <article
                key={review._id}
                className="rounded-2xl border-2 border-zinc-900 bg-white p-5"
              >
                <div className="flex flex-col gap-3 sm:flex-row">
                  <input
                    className={`${input} sm:max-w-24`}
                    type="number"
                    min="1"
                    max="5"
                    value={review.reviewRating}
                    onFocus={() => { editingReviewRef.current = review._id; }}
                    onChange={(e) => {
                      editingReviewRef.current = review._id;
                      setReviews((currentReviews) =>
                        currentReviews.map((item) =>
                          item._id === review._id
                            ? { ...item, reviewRating: Number(e.target.value) }
                            : item,
                        ),
                      );
                    }}
                  />
                  <input
                    className={input}
                    value={review.reviewComment}
                    onFocus={() => { editingReviewRef.current = review._id; }}
                    onChange={(e) => {
                      editingReviewRef.current = review._id;
                      setReviews((currentReviews) =>
                        currentReviews.map((item) =>
                          item._id === review._id
                            ? { ...item, reviewComment: e.target.value }
                            : item,
                        ),
                      );
                    }}
                  />
                  <button
                    onClick={() => updateReview(review)}
                    className="cursor-pointer rounded-full bg-blue-950 px-4 py-2 text-xs font-bold uppercase text-white"
                  >
                    Save
                  </button>
                </div>
                <div className="mt-3 border-t border-zinc-300 pt-3 text-sm text-zinc-500">
                  <p>Product: <span className="font-semibold text-zinc-800">{review.productId?.productName || "Unknown product"}</span></p>
                  <p>By: {review.userId?.firstName || "Customer"} {review.userId?.lastName || ""}</p>
                  <p>Submitted: {review.createdAt ? new Date(review.createdAt).toLocaleString() : "Date unavailable"}</p>
                  <p className="mt-1 text-zinc-700">Feedback: {review.reviewComment || "No written feedback"}</p>
                </div>
              </article>
            ))}
            <Pagination
              page={pagedReviews.current}
              pageCount={pagedReviews.pageCount}
              onPageChange={setReviewPage}
            />
          </section>
        )}
        {tab === "Categories" && (
          <section className="mt-6">
            <div className="grid gap-4 md:grid-cols-3">
              {categories.map((category) => (
                <article key={category._id} className={`relative rounded-2xl border-2 border-zinc-900 bg-white p-5 ${expandedCategories.includes(String(category._id)) ? "z-20" : "z-0"}`}>
                  <button type="button" onClick={() => toggleCategory(category._id)} className={`cursor-pointer flex w-full items-center justify-between text-left text-sm font-bold uppercase tracking-wider ${expandedCategories.includes(String(category._id)) ? "text-blue-950" : "text-zinc-700"}`}>
                    [{category.categoryName}]<span>{expandedCategories.includes(String(category._id)) ? "−" : "+"}</span>
                  </button>
                  {expandedCategories.includes(String(category._id)) && <div className="absolute left-0 right-0 top-full mt-2 space-y-2 rounded-2xl border-2 border-zinc-900 bg-white p-5 text-sm text-zinc-700 shadow-xl">
                    {products.filter((product) => String(product.categoryId?._id || product.categoryId) === String(category._id)).length ? products.filter((product) => String(product.categoryId?._id || product.categoryId) === String(category._id)).map((product) => <div key={product._id} className="flex items-center justify-between gap-4"><span>{product.productName} · PHP {product.productPrice}</span><span className="text-right text-xs font-semibold uppercase tracking-wider text-zinc-500">{supplierName(product)}</span></div>) : <p>No products in this category.</p>}
                  </div>}
                </article>
              ))}
            </div>
          </section>
        )}
        {tab === "Users" && (
          <section className="mt-6 space-y-3">
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
              {card(userCounts.admin, "Admin", true)}
              {card(userCounts.customer, "Customer", true)}
              {card(userCounts.supplier, "Supplier", true)}
              {card(userCounts.active, "Active Account", true)}
              {card(userCounts.inactive, "Deactive Account", true)}
            </div>
            <input
              value={userSearch}
              onChange={(e) => { setUserSearch(e.target.value); setUserPage(1); }}
              className={input}
              placeholder="Search users by name, email, or role"
              aria-label="Search users by name, email, or role"
            />
            <div className="grid gap-4 md:grid-cols-2">
            {pagedUsers.items.map((account) => (
              <article
                key={account._id}
                className="relative grid gap-4 overflow-hidden rounded-lg border border-zinc-200 bg-white p-4 pt-5 pr-24 shadow-sm"
              >
                <div className="absolute left-0 top-0 flex h-1 w-full">
                  <span className="w-3/4 bg-blue-950" />
                  <span className="w-1/4 bg-yellow-400" />
                </div>
                <div className="absolute right-0 top-0 h-[25%] w-1 bg-yellow-400 [clip-path:polygon(0_0,100%_0,100%_100%,0_85%)]" />
                <div>
                  <h3 className="text-base font-semibold text-blue-950">
                    {account.firstName} {account.lastName}
                  </h3>
                  <p className="mt-1 text-xs font-medium uppercase tracking-wider text-zinc-500">{account.userRole}</p>
                  <div className="mt-3 space-y-1 text-xs">
                    <p className="break-all font-semibold text-zinc-500">
                      <span className={account.isActive ? "text-green-700" : "text-red-700"}>
                        {account.isActive ? "Active" : "Inactive"}
                      </span>
                      {" - ID "}
                      {account._id}
                    </p>
                    <p className="break-words text-zinc-700">{account.email}</p>
                    <p className="text-zinc-600">Contact: {account.contactNumber || "Not provided"}</p>
                    <p className="text-zinc-600">Address: {account.address || "Not provided"}</p>
                    <p className="text-zinc-500">Created: {account.createdAt ? new Date(account.createdAt).toLocaleString() : "Unavailable"}</p>
                    <p className="text-zinc-500">Updated: {account.updatedAt ? new Date(account.updatedAt).toLocaleString() : "Unavailable"}</p>
                  </div>
                </div>
                <div className="absolute right-3 top-7 flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => openUserEditor(account)}
                    aria-label={`Edit ${account.firstName} ${account.lastName}`}
                    title="Edit user"
                    className="cursor-pointer rounded-full border-2 border-blue-950 p-2 text-blue-950 transition hover:bg-blue-50"
                  >
                    <svg aria-hidden="true" className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="m16.9 3.1 4 4M4 20l3.5-.7L19.5 7.3a2.8 2.8 0 0 0-4-4L3.5 15.3 4 20Z" /></svg>
                  </button>
                  <button
                    type="button"
                    onClick={() => setDeactivatingUser(account)}
                    aria-label={`${account.isActive ? "Deactivate" : "Activate"} ${account.firstName} ${account.lastName}`}
                    title={account.isActive ? "Deactivate user" : "Activate user"}
                    className={`cursor-pointer rounded-full border-2 p-2 transition ${account.isActive ? "border-red-700 text-red-700 hover:bg-red-50" : "border-yellow-600 text-yellow-700 hover:bg-yellow-50"}`}
                  >
                    <svg aria-hidden="true" className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M4 7h16M10 11v6M14 11v6M6 7l1 13h10l1-13M9 7V4h6v3" /></svg>
                  </button>
                </div>
              </article>
            ))}
            </div>
            <Pagination
              page={pagedUsers.current}
              pageCount={pagedUsers.pageCount}
              onPageChange={setUserPage}
            />
          </section>
        )}
      </main>
      {editingUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-blue-950/70 px-4 py-6" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) setEditingUser(null); }}>
          <form onSubmit={saveUser} className="w-full max-w-2xl border-2 border-zinc-900 bg-zinc-50 p-6 text-zinc-900 shadow-2xl sm:p-8" role="dialog" aria-modal="true" aria-labelledby="edit-user-title">
            <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-zinc-500">User management</p>
            <h2 id="edit-user-title" className="mt-2 text-2xl font-bold text-blue-950">Edit user details</h2>
            <div className="mt-5 grid gap-4 sm:grid-cols-2">
              <label className="grid gap-1 text-sm font-semibold text-zinc-700">First name<input className={input} value={userForm.firstName} onChange={(event) => setUserForm({ ...userForm, firstName: event.target.value })} required /></label>
              <label className="grid gap-1 text-sm font-semibold text-zinc-700">Last name<input className={input} value={userForm.lastName} onChange={(event) => setUserForm({ ...userForm, lastName: event.target.value })} required /></label>
              <label className="grid gap-1 text-sm font-semibold text-zinc-700">Email<input className={input} type="email" value={userForm.email} onChange={(event) => setUserForm({ ...userForm, email: event.target.value })} required /></label>
              <label className="grid gap-1 text-sm font-semibold text-zinc-700">Contact number<input className={input} value={userForm.contactNumber} onChange={(event) => setUserForm({ ...userForm, contactNumber: event.target.value })} /></label>
              <label className="grid gap-1 text-sm font-semibold text-zinc-700 sm:col-span-2">Address<input className={input} value={userForm.address} onChange={(event) => setUserForm({ ...userForm, address: event.target.value })} /></label>
              <label className="grid gap-1 text-sm font-semibold text-zinc-700">Role<select className={selectInput} value={userForm.userRole} onChange={(event) => setUserForm({ ...userForm, userRole: event.target.value })}><option value="customer">Customer</option><option value="admin">Admin</option><option value="supplier">Supplier</option></select></label>
              {userForm.userRole === "supplier" && <label className="grid gap-1 text-sm font-semibold text-zinc-700">Supplier record<select className={selectInput} value={userForm.supplierId} onChange={(event) => setUserForm({ ...userForm, supplierId: event.target.value })} required><option value="">Select supplier</option>{suppliers.map((supplier) => <option key={supplier._id} value={supplier._id}>{supplier.supplierName}</option>)}</select></label>}
            </div>
            <p className="mt-4 text-xs text-zinc-500">Password changes are managed separately and cannot be edited here.</p>
            <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-end">
              <button type="button" onClick={() => setEditingUser(null)} className="cursor-pointer rounded-xl border-2 border-zinc-900 px-4 py-3 text-xs font-bold uppercase tracking-wider">Cancel</button>
              <button type="submit" className="cursor-pointer rounded-xl border-2 border-blue-950 bg-blue-950 px-4 py-3 text-xs font-bold uppercase tracking-wider text-white">Save changes</button>
            </div>
          </form>
        </div>
      )}
      {deactivatingUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-blue-950/70 px-4 py-6" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) setDeactivatingUser(null); }}>
          <section className="w-full max-w-md border-2 border-zinc-900 bg-zinc-50 p-6 text-zinc-900 shadow-2xl sm:p-8" role="dialog" aria-modal="true" aria-labelledby="deactivate-user-title">
            <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-zinc-500">User management</p>
            <h2 id="deactivate-user-title" className="mt-2 text-2xl font-bold text-blue-950">{deactivatingUser.isActive ? "Deactivate this user?" : "Activate this user?"}</h2>
            <p className="mt-3 text-sm leading-6 text-zinc-600">{deactivatingUser.firstName} {deactivatingUser.lastName} will be marked as {deactivatingUser.isActive ? "inactive" : "active"}. User records are never deleted.</p>
            <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-end">
              <button type="button" onClick={() => setDeactivatingUser(null)} className="cursor-pointer rounded-xl border-2 border-zinc-900 px-4 py-3 text-xs font-bold uppercase tracking-wider">Cancel</button>
              <button type="button" onClick={() => { const account = deactivatingUser; setDeactivatingUser(null); void updateUser(account, { isActive: !account.isActive }); }} className="cursor-pointer rounded-xl border-2 border-blue-950 bg-blue-950 px-4 py-3 text-xs font-bold uppercase tracking-wider text-white">{deactivatingUser.isActive ? "Deactivate" : "Activate"}</button>
            </div>
          </section>
        </div>
      )}
      {pendingOrderConfirmation && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-blue-950/70 px-4 py-6"
          role="presentation"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) setPendingOrderConfirmation(null);
          }}
        >
          <section className="w-full max-w-md border-2 border-zinc-900 bg-zinc-50 p-6 text-zinc-900 shadow-2xl sm:p-8" role="dialog" aria-modal="true" aria-labelledby="pending-order-title">
            <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-zinc-500">Order confirmation</p>
            <h2 id="pending-order-title" className="mt-2 text-2xl font-bold text-blue-950">Confirm this pending order?</h2>
            <p className="mt-3 text-sm leading-6 text-zinc-600">Confirming will move order #{pendingOrderConfirmation._id.slice(-6).toUpperCase()} from Pending to Processing.</p>
            <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-end">
              <button type="button" onClick={() => setPendingOrderConfirmation(null)} className="cursor-pointer rounded-xl border-2 border-zinc-900 px-4 py-3 text-xs font-bold uppercase tracking-wider text-zinc-900">Review later</button>
              <button type="button" onClick={() => { const order = pendingOrderConfirmation; setPendingOrderConfirmation(null); void updateOrder(order, "Processing"); }} className="cursor-pointer rounded-xl border-2 border-blue-950 bg-blue-950 px-4 py-3 text-xs font-bold uppercase tracking-wider text-white">Confirm and process</button>
            </div>
          </section>
        </div>
      )}
    </div>
  );
}