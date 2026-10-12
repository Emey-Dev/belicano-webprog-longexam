import { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import Pagination from "../../components/Pagination.jsx";
import { paginate } from "../../utils/pagination.js";
import { authHeaders, useAuth } from "../../context/useAuth.js";
import { apiUrl } from "../../config/api.js";
import { resolveProductImage } from "../../utils/productImage.js";
import ProductImageUpload from "../../components/ProductImageUpload.jsx";

const tabs = ["Overview", "Products", "Orders", "Reviews", "Categories"];
const input =
  "w-full rounded-xl border border-zinc-300 bg-white px-3 py-2 text-sm outline-none focus:border-blue-950 focus:ring-2 focus:ring-yellow-300";
const selectInput = `${input} cursor-pointer appearance-none border-blue-200 bg-blue-50`;
const filterInput = "w-full rounded-xl border-2 border-zinc-900 bg-white px-3 py-2 text-sm outline-none focus:border-blue-950 focus:ring-2 focus:ring-yellow-300";
const filterSelect = "cursor-pointer rounded-xl border-2 border-zinc-900 bg-white px-3 py-2 text-sm outline-none focus:border-blue-950 focus:ring-2 focus:ring-yellow-300";
const statusClasses = {
  Pending: "bg-yellow-100 text-yellow-900",
  Processing: "bg-blue-100 text-blue-900",
  "Ready for pickup": "bg-green-100 text-green-900",
  Completed: "bg-zinc-200 text-zinc-800",
  Cancelled: "bg-red-100 text-red-900",
};

const emptyForm = {
  productName: "",
  productSlug: "",
  productDescription: "",
  productPrice: "",
  stockQuantity: "",
  stockStatus: "In stock",
  productImage: "",
  isActive: true,
};

export default function SupplierPage() {
  const { user, token } = useAuth();
  const navigate = useNavigate();
  const headers = useMemo(() => authHeaders(token), [token]);
  const [tab, setTab] = useState("Overview");
  const [supplier, setSupplier] = useState(null);
  const [totalSales, setTotalSales] = useState(0);
  const [products, setProducts] = useState([]);
  const [orders, setOrders] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [categories, setCategories] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [imageFile, setImageFile] = useState(null);
  const [editId, setEditId] = useState("");
  const [message, setMessage] = useState("");
  const [productSearch, setProductSearch] = useState("");
  const [orderSearch, setOrderSearch] = useState("");
  const [reviewSearch, setReviewSearch] = useState("");
  const [productSort, setProductSort] = useState("all");
  const [orderSort, setOrderSort] = useState("all");
  const [reviewSort, setReviewSort] = useState("all");
  const [productPage, setProductPage] = useState(1);
  const [orderPage, setOrderPage] = useState(1);
  const [reviewPage, setReviewPage] = useState(1);
  const [showInactiveProducts, setShowInactiveProducts] = useState(false);
  const [expandedCategories, setExpandedCategories] = useState([]);
  const changeTab = (nextTab) => {
    setTab(nextTab);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };
  const toggleCategory = (categoryId) => {
    const id = String(categoryId);
    setExpandedCategories((current) =>
      current.includes(id) ? current.filter((item) => item !== id) : [...current, id],
    );
  };

  const load = useCallback(async () => {
    const [dashboardResponse, categoryResponse] = await Promise.all([
      fetch(apiUrl("v1/supplier/dashboard"), { headers }),
      fetch(apiUrl("category")),
    ]);
    if (!dashboardResponse.ok || !categoryResponse.ok) throw Error();
    const data = await dashboardResponse.json();
    const categoryData = await categoryResponse.json();
    setSupplier(data.supplier);
    setProducts(data.products || []);
    setOrders(data.orders || []);
    setReviews(data.reviews || []);
    setTotalSales(data.totalSales || 0);
    setCategories(categoryData.data || categoryData);
  }, [headers]);

  useEffect(() => {
    if (!user || user.userRole !== "supplier") navigate("/");
    else {
      void load().catch(() => navigate("/"));
      const refresh = window.setInterval(() => {
        void load().catch((error) => console.error("Supplier data refresh failed:", error));
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

  const saveProduct = async (event) => {
    event.preventDefault();
    try {
      const body = new FormData();
      Object.entries({
        ...form,
        productPrice: Number(form.productPrice),
        stockQuantity: Number(form.stockQuantity),
      }).forEach(([key, value]) => body.append(key, String(value ?? "")));
      if (imageFile) body.append("image", imageFile);

      const response = await fetch(editId ? apiUrl(`products/${editId}`) : apiUrl("products"), {
        method: editId ? "PUT" : "POST",
        headers: authHeaders(token, false),
        body,
      });
      const data = await response.json();
      if (!response.ok) throw Error(data.message);
      flash(editId ? "Product updated." : "Product created.");
      setForm(emptyForm);
      setImageFile(null);
      setEditId("");
      await load();
    } catch (error) {
      flash(error.message || "Unable to update product.");
    }
  };
  const toggleProduct = async (product) => {
    try {
      const response = await fetch(apiUrl(`products/${product._id}`), {
        method: "PUT",
        headers,
        body: JSON.stringify({ isActive: product.isActive === false }),
      });
      const data = await response.json();
      if (!response.ok) throw Error(data.message);
      flash(product.isActive === false ? "Product enabled." : "Product disabled.");
      await load();
    } catch (error) {
      flash(error.message || "Unable to update product status.");
    }
  };

  const matches = (value, search) =>
    String(value || "").toLowerCase().includes(search.trim().toLowerCase());
  const visibleProducts = products.filter((product) =>
    (showInactiveProducts ? product.isActive === false : product.isActive !== false) &&
    matches(`${product.productName} ${product.productSlug}`, productSearch),
  );
  const visibleOrders = orders.filter((order) =>
    matches(
      `${order._id} ${order.userId?.firstName} ${order.userId?.lastName} ${order.userId?.email} ${order.orderItems?.map((item) => item.productName).join(" ")}`,
      orderSearch,
    ) && (orderSort === "all" || order.orderStatus === orderSort),
  );
  const visibleReviews = reviews.filter((review) =>
    matches(
      `${review.productId?.productName} ${review.userId?.firstName} ${review.userId?.lastName} ${review.reviewComment} ${review.reviewRating}`,
      reviewSearch,
    ) && (reviewSort === "all" || (reviewSort === "rating-high" && review.reviewRating >= 4) || (reviewSort === "rating-low" && review.reviewRating <= 3)),
  );
  const sortedProducts = [...visibleProducts].sort((left, right) => productSort === "stock-asc"
    ? left.stockQuantity - right.stockQuantity
    : productSort === "stock-desc"
      ? right.stockQuantity - left.stockQuantity
      : 0);
  const sortedOrders = visibleOrders;
  const sortedReviews = [...visibleReviews].sort((left, right) => {
    if (reviewSort === "rating-high") return right.reviewRating - left.reviewRating;
    if (reviewSort === "rating-low") return left.reviewRating - right.reviewRating;
    return 0;
  });
  const pagedProducts = paginate(sortedProducts, productPage);
  const pagedOrders = paginate(sortedOrders, orderPage);
  const pagedReviews = paginate(sortedReviews, reviewPage);
  const card = (value, label) => (
    <article className="rounded-3xl border-2 border-zinc-900 bg-zinc-50 p-5">
      <p className="text-3xl font-bold text-blue-950">{value}</p>
      <p className="mt-2 text-[11px] font-semibold uppercase tracking-[0.2em] text-zinc-500">{label}</p>
    </article>
  );

  return (
    <div className="min-h-screen bg-zinc-100 px-4 py-8 sm:px-6">
      <main className="mx-auto max-w-7xl">
        <section className="rounded-3xl border-2 border-zinc-900 bg-blue-950 p-6 text-white sm:p-8">
          <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-yellow-400">Supplier workspace</p>
              <h1 className="mt-2 text-3xl font-bold sm:text-4xl">{supplier?.supplierName || "Supplier dashboard"}</h1>
              <p className="mt-3 max-w-xl text-sm text-blue-100">View your products, associated orders, and customer reviews. You can edit your products, but order and review records are read-only.</p>
            </div>
            <Link to="/products" className="rounded-full border-2 border-yellow-400 px-4 py-2 text-center text-xs font-bold uppercase tracking-wider text-yellow-300">Browse storefront</Link>
          </div>
        </section>
        {message && <p className="fixed right-5 top-5 z-50 max-w-sm rounded-xl border border-blue-200 bg-blue-50 p-3 text-sm text-blue-950 shadow-lg">{message}</p>}
        <nav className="mt-6 flex gap-2 overflow-x-auto border-b-2 border-zinc-900 pb-3">
          {tabs.map((name) => (
            <button key={name} onClick={() => changeTab(name)} className={`cursor-pointer whitespace-nowrap rounded-full px-4 py-2 text-xs font-bold uppercase tracking-wider ${tab === name ? "bg-yellow-400 text-blue-950" : "bg-white text-zinc-700"}`}>{name}</button>
          ))}
        </nav>
        {tab === "Overview" && (
          <section className="mt-6">
            <article className="rounded-3xl border-2 border-zinc-900 bg-white p-6">
              <h2 className="text-xl font-bold">Supplier workflow</h2>
              <p className="mt-2 text-sm text-zinc-600">Keep your catalog details current and use order and review lists to understand how your products are performing. Admins manage all order statuses and reviews.</p>
            </article>
            <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{card(products.length, "Owned products")}{card(orders.length, "Associated orders")}{card(reviews.length, "Product reviews")}</div>
            <article className="mt-6 rounded-3xl border-2 border-zinc-900 bg-white p-6"><p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-zinc-500">Sales overview</p><h2 className="mt-2 text-3xl font-bold text-blue-950">PHP {totalSales.toLocaleString()}</h2><p className="mt-1 text-sm text-zinc-600">Sales from your products in non-cancelled orders.</p></article>
          </section>
        )}
        {tab === "Products" && (
          <section className="mt-6 grid gap-6 lg:grid-cols-[.9fr_1.1fr]">
            <form onSubmit={saveProduct} className="rounded-3xl border-2 border-zinc-900 bg-white p-5">
              <div className="flex justify-between"><h2 className="text-xl font-bold">{editId ? "Edit product" : "Create product"}</h2>{editId && <button type="button" onClick={() => { setEditId(""); setForm(emptyForm); setImageFile(null); }} className="text-sm underline">Cancel</button>}</div>
              <div className="mt-4 grid gap-3">
                {!editId && <p className="text-sm text-zinc-600">Add a product to your supplier catalog.</p>}
                <label className="grid gap-1 text-sm font-semibold text-zinc-700">Product name<input className={input} value={form.productName} onChange={(e) => setForm({ ...form, productName: e.target.value })} required /></label>
                <label className="grid gap-1 text-sm font-semibold text-zinc-700">URL slug<input className={input} value={form.productSlug} onChange={(e) => setForm({ ...form, productSlug: e.target.value })} required /></label>
                <label className="grid gap-1 text-sm font-semibold text-zinc-700">Description<textarea className={input} value={form.productDescription} onChange={(e) => setForm({ ...form, productDescription: e.target.value })} required /></label>
                <div className="grid grid-cols-2 gap-3">
                  <label className="grid gap-1 text-sm font-semibold text-zinc-700">Price<input className={input} type="number" min="0" value={form.productPrice} onChange={(e) => setForm({ ...form, productPrice: e.target.value })} required /></label>
                  <label className="grid gap-1 text-sm font-semibold text-zinc-700">Stock quantity<input className={input} type="number" min="0" value={form.stockQuantity} onChange={(e) => setForm({ ...form, stockQuantity: e.target.value })} required /></label>
                </div>
                <label className="grid gap-1 text-sm font-semibold text-zinc-700">Category<select className={selectInput} value={form.categoryId || ""} onChange={(e) => setForm({ ...form, categoryId: e.target.value })} required><option value="">Select category</option>{categories.map((category) => <option key={category._id} value={category._id}>{category.categoryName}</option>)}</select></label>
                <ProductImageUpload key={editId || "new"} value={form.productImage} file={imageFile} onChange={setImageFile} />
                <label className="grid gap-1 text-sm font-semibold text-zinc-700">Stock status<select className={selectInput} value={form.stockStatus} onChange={(e) => setForm({ ...form, stockStatus: e.target.value })}>{["In stock", "Low stock", "Out of stock", "Preorder"].map((item) => <option key={item}>{item}</option>)}</select></label>
                <button className="cursor-pointer rounded-full bg-blue-950 px-4 py-3 text-xs font-bold uppercase tracking-wider text-white transition hover:bg-black hover:shadow-lg">{editId ? "Save changes" : "Create product"}</button>
              </div>
            </form>
            <div className="space-y-3">
              <div className="flex flex-col gap-3 sm:flex-row"><div className="relative min-w-0 flex-1"><span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" aria-hidden="true">⌕</span><input value={productSearch} onChange={(e) => { setProductSearch(e.target.value); setProductPage(1); }} className={`${filterInput} pl-9`} placeholder="Search your products" aria-label="Search your products" /></div><select value={productSort} onChange={(e) => { setProductSort(e.target.value); setProductPage(1); }} className={`${filterSelect} sm:w-auto`} aria-label="Sort products"><option value="all">All</option><option value="stock-asc">Stock: low to high</option><option value="stock-desc">Stock: high to low</option></select></div>
              <div className="flex items-center justify-between gap-3 border-b-2 border-zinc-900 pb-3">
               <p className="text-sm text-zinc-600">{showInactiveProducts ? "Showing disabled products only." : "Showing active products only."}</p>
               <button type="button" onClick={() => { setShowInactiveProducts(!showInactiveProducts); setProductPage(1); }} className="cursor-pointer rounded-full border-2 border-blue-950 px-3 py-2 text-xs font-bold uppercase tracking-wider text-blue-950">
                 {showInactiveProducts ? "Show active" : "Show disabled"}
               </button>
              </div>
              {pagedProducts.items.map((product) => <article key={product._id} className="flex items-center justify-between gap-4 rounded-2xl border-2 border-zinc-900 bg-white p-4"><div className="flex min-w-0 items-center gap-4"><div className="flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-zinc-200 bg-zinc-50 p-2">{resolveProductImage(product.productImage) ? <img src={resolveProductImage(product.productImage)} alt={product.productName} className="h-full w-full object-contain" /> : <span className="text-center text-[10px] font-semibold uppercase tracking-wider text-zinc-400">No image</span>}</div><div><h3 className="font-bold">{product.productName}</h3><p className="text-sm text-zinc-600">PHP {product.productPrice} · {product.stockQuantity} available</p><p className="mt-1 text-xs font-bold uppercase tracking-wider text-zinc-500">{product.isActive === false ? "Disabled" : "Active"}</p></div></div><div className="flex gap-2"><button onClick={() => { setEditId(product._id); setImageFile(null); setForm({ productName: product.productName || "", productSlug: product.productSlug || "", productDescription: product.productDescription || "", productPrice: product.productPrice ?? "", stockQuantity: product.stockQuantity ?? "", stockStatus: product.stockStatus || "In stock", productImage: product.productImage || "", categoryId: product.categoryId?._id || product.categoryId || "", isActive: product.isActive !== false }); }} className="cursor-pointer rounded-full border-2 border-blue-950 px-4 py-2 text-xs font-bold uppercase">Edit</button><button onClick={() => toggleProduct(product)} className="cursor-pointer rounded-full border-2 border-blue-950 px-3 py-2 text-xs font-bold uppercase">{product.isActive === false ? "Enable" : "Disable"}</button></div></article>)}
              <Pagination page={pagedProducts.current} pageCount={pagedProducts.pageCount} onPageChange={setProductPage} />
            </div>
          </section>
        )}
        {tab === "Orders" && <section className="mt-6 space-y-3"><div className="flex flex-col gap-3 sm:flex-row"><div className="relative min-w-0 flex-1"><span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" aria-hidden="true">⌕</span><input value={orderSearch} onChange={(e) => { setOrderSearch(e.target.value); setOrderPage(1); }} className={`${filterInput} pl-9`} placeholder="Search associated orders" aria-label="Search associated orders" /></div><select value={orderSort} onChange={(e) => { setOrderSort(e.target.value); setOrderPage(1); }} className={`${filterSelect} sm:w-auto`} aria-label="Filter orders by status"><option value="all">All</option><option value="Pending">Pending</option><option value="Processing">Processing</option><option value="Ready for pickup">Ready for Pickup</option><option value="Completed">Completed</option><option value="Cancelled">Cancelled</option></select></div>{pagedOrders.items.map((order) => <article key={order._id} className="rounded-2xl border-2 border-zinc-900 bg-white p-5"><div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"><div><h3 className="font-bold">{order.userId?.firstName} {order.userId?.lastName}</h3><p className="text-sm text-zinc-600">{order.userId?.email} · PHP {order.totalAmount}</p><p className="mt-1 text-xs text-zinc-500">Contact: {order.userId?.contactNumber || "Not provided"} · Address: {order.userId?.address || "Not provided"}</p></div><span className={`w-fit rounded-full px-3 py-1 text-xs font-bold ${statusClasses[order.orderStatus]}`}>{order.orderStatus}</span></div><p className="mt-3 text-sm text-zinc-600">{order.orderItems?.map((item) => `${item.productName} × ${item.quantity}`).join(", ")}</p></article>)}<Pagination page={pagedOrders.current} pageCount={pagedOrders.pageCount} onPageChange={setOrderPage} /></section>}
        {tab === "Reviews" && <section className="mt-6 space-y-3"><div className="flex flex-col gap-3 sm:flex-row"><div className="relative min-w-0 flex-1"><span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" aria-hidden="true">⌕</span><input value={reviewSearch} onChange={(e) => { setReviewSearch(e.target.value); setReviewPage(1); }} className={`${filterInput} pl-9`} placeholder="Search reviews for your products" aria-label="Search reviews for your products" /></div><select value={reviewSort} onChange={(e) => { setReviewSort(e.target.value); setReviewPage(1); }} className={`${filterSelect} sm:w-auto`} aria-label="Sort reviews"><option value="all">All</option><option value="rating-high">Rating: high</option><option value="rating-low">Rating: low</option></select></div>{pagedReviews.items.map((review) => <article key={review._id} className="rounded-2xl border-2 border-zinc-900 bg-white p-5"><div className="flex gap-4"><div className="flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-zinc-200 bg-zinc-50 p-2">{resolveProductImage(review.productId?.productImage) ? <img src={resolveProductImage(review.productId.productImage)} alt={review.productId?.productName || "Reviewed product"} className="h-full w-full object-contain" /> : <span className="text-center text-[10px] font-semibold uppercase tracking-wider text-zinc-400">No image</span>}</div><div className="min-w-0 flex-1"><p className="font-bold">{review.productId?.productName || "Product"} · {review.reviewRating}/5</p><div className="mt-3 border-t border-zinc-300 pt-3 text-sm text-zinc-500"><p>By: {review.userId?.firstName || "Customer"} {review.userId?.lastName || ""}</p><p>Submitted: {review.createdAt ? new Date(review.createdAt).toLocaleString() : "Date unavailable"}</p><p className="mt-1 text-zinc-700">Feedback: {review.reviewComment || "No written feedback"}</p></div></div></div></article>)}<Pagination page={pagedReviews.current} pageCount={pagedReviews.pageCount} onPageChange={setReviewPage} /></section>}
        {tab === "Categories" && <section className="mt-6"><div className="grid items-start gap-4 md:grid-cols-3">{categories.map((category) => { const categoryProducts = products.filter((product) => String(product.categoryId?._id || product.categoryId) === String(category._id)); const isExpanded = expandedCategories.includes(String(category._id)); return <article key={category._id} className={`rounded-2xl border-2 border-zinc-900 bg-white p-5 ${isExpanded ? "z-20" : "z-0"}`}><button type="button" onClick={() => toggleCategory(category._id)} className={`cursor-pointer flex w-full items-center justify-between text-left text-sm font-bold uppercase tracking-wider ${isExpanded ? "text-blue-950" : "text-zinc-700"}`}>[{category.categoryName}]<span>{isExpanded ? "−" : "+"}</span></button>{isExpanded && <div className="mt-4 space-y-2 border-t-2 border-zinc-200 pt-4 text-sm text-zinc-700">{categoryProducts.length ? categoryProducts.map((product) => <p key={product._id}>{product.productName} · PHP {product.productPrice}</p>) : <p>No products in this category.</p>}</div>}</article>; })}</div></section>}
      </main>
    </div>
  );
}