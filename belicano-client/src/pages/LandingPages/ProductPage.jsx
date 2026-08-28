import { useEffect, useRef, useState } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import Button from '../../components/Button.jsx';
import Pagination from '../../components/Pagination.jsx';
import fallbackProducts, { fetchProducts, resolveProductImage } from '../../assets/product-content.js';
import { authHeaders, useAuth } from '../../context/useAuth.js';
import { apiUrl } from '../../config/api.js';

function ProductPage() {
  const { name } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { user, token } = useAuth();
  const [products, setProducts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [message, setMessage] = useState('');
  const [reviews, setReviews] = useState([]);
  const [reviewPage, setReviewPage] = useState(1);
  const [showSignInPrompt, setShowSignInPrompt] = useState(false);
  const [showCartSuccessPrompt, setShowCartSuccessPrompt] = useState(false);
  const [showQuantityPrompt, setShowQuantityPrompt] = useState(false);
  const [quantityError, setQuantityError] = useState('');
  const [quantities, setQuantities] = useState({});
  const productRequestRef = useRef(0);

  useEffect(() => {
    const requestId = productRequestRef.current + 1;
    productRequestRef.current = requestId;
    let isCurrent = true;
    fetchProducts()
      .then((nextProducts) => {
        if (isCurrent && productRequestRef.current === requestId) setProducts(nextProducts);
      })
      .catch(() => {
        if (isCurrent && productRequestRef.current === requestId) setProducts(fallbackProducts);
      })
      .finally(() => {
        if (isCurrent && productRequestRef.current === requestId) setIsLoading(false);
      });
    return () => {
      isCurrent = false;
    };
  }, [name]);

  const product =
    products.find(
      (item) =>
        item.isActive !== false &&
        (item.productSlug || item.name || item.productName)?.toLowerCase() ===
        String(name).toLowerCase(),
    ) ||
    products.find((item) => item.isActive !== false && (item.name || item.productSlug || item.productName) === name) ||
    null;
  useEffect(() => {
    const loadReviews = async () => {
      if (!product?._id) return setReviews([]);
      const response = await fetch(apiUrl(`review?productId=${product._id}`));
      if (response.ok) {
        setReviews(await response.json());
        setReviewPage(1);
      }
    };
    void loadReviews();
  }, [product]);
  const productKey = product?._id || String(name).toLowerCase();
  const displayedQuantity = quantities[productKey] || 1;
  if (isLoading) {
    return <div className="px-4 py-12 text-center text-zinc-600">Loading product...</div>;
  }
  if (!product) {
    return (
      <div className="flex w-full flex-col gap-6">
        <section className="border-y-2 border-zinc-900 bg-zinc-50 px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
          <div className="mx-auto max-w-3xl">
            <h1 className="text-3xl font-bold text-zinc-900">Product not found</h1>
            <Button to="/products" className="mt-6">Back to Products</Button>
          </div>
        </section>
      </div>
    );
  }

  const productTitle = product.productName || product.title || product.name;
  const productCategory = product.categoryId?.categoryName || product.category || 'Apparel';
  const productPrice =
    typeof product.productPrice === 'number'
      ? `PHP ${new Intl.NumberFormat('en-PH').format(product.productPrice)}`
      : product.price;
  const productStock =
    product.stockQuantity !== undefined && product.stockQuantity !== null
      ? `${product.stockQuantity} available`
      : product.stockStatus || product.stock || 'Stock unavailable';
  const reviewsPerPage = 5;
  const reviewPageCount = Math.ceil(reviews.length / reviewsPerPage);
  const visibleReviews = reviews.slice(
    (reviewPage - 1) * reviewsPerPage,
    reviewPage * reviewsPerPage,
  );
  const productImage =
    resolveProductImage(product.productImage || product.image) ||
    'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?auto=format&fit=crop&w=900&q=80';
  const productContent = Array.isArray(product.content)
    ? product.content
    : [product.productDescription || product.description || 'No product details available.'];
  const addToCart = () => {
    if (!user) return setShowSignInPrompt(true);
    if (!product._id) return setMessage('Please wait for the catalog to connect before adding this item.');
    if (product.stockQuantity !== undefined && product.stockQuantity < 1)
      return setMessage('This product is currently out of stock.');
    setQuantityError('');
    setShowQuantityPrompt(true);
  };
  const confirmAddToCart = async () => {
    const selectedQuantity = Number(displayedQuantity);
    if (!Number.isInteger(selectedQuantity) || selectedQuantity < 1) {
      setQuantityError('Please enter a valid whole-number quantity.');
      return;
    }
    if (product.stockQuantity !== undefined && selectedQuantity > product.stockQuantity) {
      setQuantityError(`Unable to add this product. Only ${product.stockQuantity} item(s) are available. Please try again.`);
      return;
    }
    if (product.stockQuantity !== undefined && product.stockQuantity < 1)
      return setMessage('This product is currently out of stock.');
    try {
      const current = await fetch(apiUrl(`cart/${user._id}`), { headers: authHeaders(token) });
      const cart = current.status === 404 ? { cartItems: [] } : await current.json();
      if (!current.ok && current.status !== 404) return setMessage(cart.message || 'Unable to load your cart.');
      const existing = cart.cartItems.find((item) => String(item.productId?._id || item.productId) === String(product._id));
      const nextQuantity = existing ? existing.quantity + selectedQuantity : selectedQuantity;
      if (product.stockQuantity !== undefined && nextQuantity > product.stockQuantity) {
        if (existing) {
          const remainingQuantity = Math.max(product.stockQuantity - existing.quantity, 0);
          setQuantityError(
            `This product is already in your cart with ${existing.quantity} item(s). You are trying to add ${selectedQuantity} more, but only ${remainingQuantity} additional item(s) can be added within the ${product.stockQuantity}-item stock limit.`,
          );
          setShowQuantityPrompt(true);
          return;
        }
        setQuantityError(`Unable to add this product. Only ${product.stockQuantity} item(s) are available. Please try again.`);
        setShowQuantityPrompt(true);
        return;
      }
      const cartItems = existing
        ? cart.cartItems.map((item) => (
          item === existing
            ? { productId: product._id, quantity: nextQuantity }
            : { productId: item.productId?._id || item.productId, quantity: item.quantity }
        ))
        : [
          ...cart.cartItems.map((item) => ({
            productId: item.productId?._id || item.productId,
            quantity: item.quantity,
          })),
          { productId: product._id, quantity: selectedQuantity },
        ];
      const previousCount = cart.cartItems.reduce((total, item) => total + item.quantity, 0);
      const optimisticCount = cartItems.reduce((total, item) => total + item.quantity, 0);
      window.dispatchEvent(new CustomEvent('cart-updated', { detail: { cartCount: optimisticCount } }));
      const response = await fetch(apiUrl(`cart/${user._id}`), { method: 'PUT', headers: authHeaders(token), body: JSON.stringify({ cartItems }) });
      const data = await response.json();
      if (!response.ok) {
        setQuantityError(data.message || 'Unable to add this product to your cart. Please try again.');
        setShowQuantityPrompt(true);
      }
      setMessage(response.ok ? 'Added to your cart.' : data.message || 'Unable to add this item to your cart.');
      if (!response.ok) {
        window.dispatchEvent(new CustomEvent('cart-updated', { detail: { cartCount: previousCount } }));
      } else {
        setShowQuantityPrompt(false);
        const count = Array.isArray(data.cartItems)
          ? data.cartItems.reduce((total, item) => total + item.quantity, 0)
          : optimisticCount;
        window.dispatchEvent(new CustomEvent('cart-updated', { detail: { cartCount: count } }));
        setMessage('');
        setShowCartSuccessPrompt(true);
      }
    } catch {
      setQuantityError('Unable to add this product to your cart. Please try again.');
      setShowQuantityPrompt(true);
      setMessage('Unable to add this item to your cart.');
    }
  };
  return (
    <>
      <div className="flex w-full flex-col gap-6">
      <section className="border-y-2 border-zinc-900 bg-zinc-50 px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
        <div className="max-w-3xl">
          <div className="mb-4">
            <Button to={location.state?.from || "/products"} state={{ restoreScroll: Boolean(location.state?.restoreScroll) }}>Back to Products</Button>
          </div>
          <p className="mb-3 text-[11px] font-semibold uppercase tracking-[0.28em] text-zinc-500">
            {productCategory}
          </p>
          <h1 className="text-3xl font-bold leading-tight text-zinc-900 sm:text-4xl">
            {productTitle}
          </h1>
          <div className="mt-3 flex flex-wrap items-center gap-3 text-sm text-zinc-600">
            <span className="font-bold text-zinc-900">{productPrice}</span>
            <span>{productStock}</span>
          </div>
        </div>
      </section>

      <section className="border-y-2 border-zinc-900 bg-zinc-50 px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
        <div className="mx-auto grid max-w-6xl gap-8 lg:grid-cols-[0.8fr_1.2fr] lg:items-start">
          <section className="order-2 rounded-3xl border-2 border-zinc-900 bg-white p-5 lg:order-1">
            <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-zinc-500">Community feedback</p>
            <h2 className="mt-2 text-2xl font-bold text-zinc-900">Customer Reviews</h2>
            {reviews.length ? (
              <>
                <div className="mt-4 space-y-3">
                  {visibleReviews.map((item) => (
                    <article key={item._id} className="rounded-xl border border-zinc-300 bg-zinc-50 p-4">
                      <p className="font-semibold">{item.userId?.firstName || 'Customer'} — {item.reviewRating}/5</p>
                      <p className="mt-1 text-sm leading-6 text-zinc-700">{item.reviewComment || "No written feedback."}</p>
                    </article>
                  ))}
                </div>
                <Pagination page={reviewPage} pageCount={reviewPageCount} onPageChange={setReviewPage} />
              </>
            ) : <p className="mt-3 text-zinc-600">No reviews yet.</p>}
            <p className="mt-5 rounded-xl bg-blue-50 p-4 text-sm leading-6 text-blue-950">Reviews can be submitted from <strong>My Orders</strong> after you confirm that an order has been received.</p>
          </section>

          <div className="order-1 rounded-3xl border-2 border-zinc-900 bg-white p-5 lg:order-2 sm:p-6">
            <div className="mx-auto mb-8 aspect-square w-[70%] overflow-hidden rounded-[1.25rem] border-2 border-zinc-900 bg-white p-4">
              <img src={productImage} alt={productTitle} className="h-full w-full object-contain" />
            </div>
            <div className="grid gap-3 sm:grid-cols-3">
              <div className="rounded-xl bg-blue-50 p-3"><p className="text-[10px] font-bold uppercase tracking-wider text-zinc-500">Category</p><p className="mt-1 font-semibold text-blue-950">{productCategory}</p></div>
              <div className="rounded-xl bg-blue-50 p-3"><p className="text-[10px] font-bold uppercase tracking-wider text-zinc-500">Price</p><p className="mt-1 font-semibold text-blue-950">{productPrice}</p></div>
              <div className="rounded-xl bg-blue-50 p-3"><p className="text-[10px] font-bold uppercase tracking-wider text-zinc-500">Stock</p><p className="mt-1 font-semibold text-blue-950">{productStock}</p></div>
            </div>
            <div className="mt-6 border-t-2 border-zinc-900 pt-5">
              <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-zinc-500">Product details</p>
              <div className="mt-3 space-y-4">
                {productContent.map((paragraph, index) => <p key={index} className="text-base leading-7 text-zinc-700 whitespace-pre-wrap">{paragraph}</p>)}
              </div>
            </div>
            <div className="mt-8 flex flex-wrap items-end justify-center gap-3 border-t border-zinc-300 pt-6">
              {user?.userRole !== 'supplier' && <Button onClick={addToCart}>Add to Cart</Button>}
              <Button to="/">View Best Sellers</Button>
              <Button to={location.state?.from || "/products"} state={{ restoreScroll: Boolean(location.state?.restoreScroll) }}>Back to Products</Button>
            </div>
            {message && <p className="mt-4 text-sm font-medium text-blue-900">{message}</p>}
          </div>
        </div>
      </section>
      </div>
      {showSignInPrompt && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-blue-950/70 px-4 py-6"
          role="presentation"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) setShowSignInPrompt(false);
          }}
        >
          <section
            className="w-full max-w-md border-2 border-zinc-900 bg-zinc-50 p-6 shadow-2xl sm:p-8"
            role="dialog"
            aria-modal="true"
            aria-labelledby="signin-prompt-title"
          >
            <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-zinc-500">
              Customer access
            </p>
            <h2 id="signin-prompt-title" className="mt-2 text-2xl font-bold text-blue-950">
              You are not signed in
            </h2>
            <p className="mt-3 text-sm leading-6 text-zinc-600">
              Sign in to add items to your cart and keep track of your campus
              orders.
            </p>
            <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-end">
              <button
                type="button"
                onClick={() => setShowSignInPrompt(false)}
                className="rounded-xl border-2 border-zinc-900 px-4 py-3 text-xs font-bold uppercase tracking-wider text-zinc-900 transition hover:bg-zinc-100"
              >
                Continue browsing
              </button>
              <button
                type="button"
                onClick={() => navigate('/auth/signin', { state: { from: `/products/${name}` } })}
                className="rounded-xl border-2 border-blue-950 bg-blue-950 px-4 py-3 text-xs font-bold uppercase tracking-wider text-white transition hover:border-black hover:bg-black"
              >
                Sign in to continue
              </button>
            </div>
          </section>
        </div>
      )}
      {showQuantityPrompt && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-blue-950/70 px-4 py-6"
          role="presentation"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) setShowQuantityPrompt(false);
          }}
        >
          <section
            className="w-full max-w-md border-2 border-zinc-900 bg-zinc-50 p-6 text-zinc-900 shadow-2xl sm:p-8"
            role="dialog"
            aria-modal="true"
            aria-labelledby="quantity-prompt-title"
          >
            <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-zinc-500">
              Cart quantity
            </p>
            <h2 id="quantity-prompt-title" className="mt-2 text-2xl font-bold text-blue-950">
              How many would you like?
            </h2>
            <p className="mt-3 text-sm leading-6 text-zinc-600">
              Choose the quantity of {productTitle} to add to your cart.
            </p>
            <input
              type="number"
              min="1"
              max={product.stockQuantity}
              value={displayedQuantity}
              onChange={(event) => setQuantities((current) => ({
                ...current,
                [productKey]: event.target.value,
              }))}
              className="mt-5 h-12 w-full rounded-xl border-2 border-zinc-900 px-4 text-center text-lg font-bold text-zinc-900 outline-none focus:ring-2 focus:ring-yellow-400"
              aria-label={`Quantity of ${productTitle}`}
            />
            {quantityError && (
              <p className="mt-3 rounded-xl border border-red-200 bg-red-50 p-3 text-sm font-medium text-red-800">
                {quantityError}
              </p>
            )}
            <p className="mt-2 text-center text-xs text-zinc-500">
              {product.stockQuantity} available
            </p>
            <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-end">
              <button
                type="button"
                onClick={() => setShowQuantityPrompt(false)}
                className="cursor-pointer rounded-xl border-2 border-zinc-900 px-4 py-3 text-xs font-bold uppercase tracking-wider text-zinc-900 transition hover:bg-zinc-100"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={confirmAddToCart}
                className="cursor-pointer rounded-xl border-2 border-blue-950 bg-blue-950 px-4 py-3 text-xs font-bold uppercase tracking-wider text-white transition hover:border-black hover:bg-black"
              >
                Add to cart
              </button>
            </div>
          </section>
        </div>
      )}
      {showCartSuccessPrompt && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-blue-950/70 px-4 py-6"
          role="presentation"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) setShowCartSuccessPrompt(false);
          }}
        >
          <section
            className="w-full max-w-md border-2 border-zinc-900 bg-zinc-50 p-6 text-zinc-900 shadow-2xl sm:p-8"
            role="dialog"
            aria-modal="true"
            aria-labelledby="cart-success-title"
          >
            <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-zinc-500">
              Cart updated
            </p>
            <h2 id="cart-success-title" className="mt-2 text-2xl font-bold text-blue-950">
              Product successfully added to cart
            </h2>
            <p className="mt-3 text-sm leading-6 text-zinc-600">
              {productTitle} is now in your cart. What would you like to do next?
            </p>
            <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-end">
              <button
                type="button"
                onClick={() => {
                  setShowCartSuccessPrompt(false);
                  navigate(location.state?.from || '/products', {
                    state: { restoreScroll: Boolean(location.state?.restoreScroll) },
                  });
                }}
                className="cursor-pointer rounded-xl border-2 border-zinc-900 px-4 py-3 text-xs font-bold uppercase tracking-wider text-zinc-900 transition hover:bg-zinc-100"
              >
                Browse another product
              </button>
              <button
                type="button"
                onClick={() => navigate('/cart')}
                className="cursor-pointer rounded-xl border-2 border-blue-950 bg-blue-950 px-4 py-3 text-xs font-bold uppercase tracking-wider text-white transition hover:border-black hover:bg-black"
              >
                Go to cart
              </button>
            </div>
          </section>
        </div>
      )}
    </>
  );
}

export default ProductPage;
