import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { authHeaders, useAuth } from "../../context/useAuth.js";
import { apiUrl } from "../../config/api.js";
import { resolveProductImage } from "../../utils/productImage.js";

const EMPTY_CART_ITEMS = [];

export default function CartPage() {
  const { user, token } = useAuth();
  const navigate = useNavigate();
  const [cart, setCart] = useState(null);
  const [message, setMessage] = useState("");
  const [showOrderPrompt, setShowOrderPrompt] = useState(false);
  const [selectedItems, setSelectedItems] = useState({});
  const cartRef = useRef(null);
  const saveQueueRef = useRef(Promise.resolve());
  const saveInProgressRef = useRef(false);
  const userId = user?._id;
  const userRole = user?.userRole;
  const load = useCallback(async () => {
    const response = await fetch(apiUrl(`cart/${userId}`), {
      headers: authHeaders(token),
    });
    const nextCart = response.status === 404 ? { cartItems: [] } : await response.json();
    cartRef.current = nextCart;
    setCart(nextCart);
    window.dispatchEvent(new CustomEvent("cart-updated", {
      detail: { cartCount: nextCart.cartItems.reduce((total, currentItem) => total + currentItem.quantity, 0) },
    }));
  }, [userId, token]);
  const refreshAvailability = useCallback(async () => {
    if (saveInProgressRef.current) return;
    const response = await fetch(apiUrl(`cart/${userId}`), { headers: authHeaders(token) });
    if (!response.ok) return;
    const latestCart = await response.json();
    if (!cartRef.current) return;
    const latestProducts = new Map(
      latestCart.cartItems.map((item) => [String(item.productId?._id || item.productId), item.productId]),
    );
    const refreshedCart = {
      ...cartRef.current,
      cartItems: cartRef.current.cartItems.map((item) => ({
        ...item,
        productId: latestProducts.get(String(item.productId?._id || item.productId)) || item.productId,
      })),
    };
    cartRef.current = refreshedCart;
    setCart(refreshedCart);
  }, [userId, token]);
  useEffect(() => {
    if (!userId) navigate("/auth/signin", { state: { from: "/cart" } });
    else if (!["customer", "admin"].includes(userRole)) navigate("/");
    else {
      void Promise.resolve()
        .then(load)
        .catch(() => setMessage("Unable to load your cart."));
      const availabilityTimer = window.setInterval(() => {
        void refreshAvailability().catch(() => {});
      }, 3000);
      return () => window.clearInterval(availabilityTimer);
    }
  }, [userId, userRole, token, navigate, load, refreshAvailability]);
  const items = cart?.cartItems ?? EMPTY_CART_ITEMS;
  const getProductId = (item) => String(item.productId?._id || item.productId);
  const isItemUnavailable = (item) =>
    !item.productId || item.productId.stockQuantity < item.quantity;
  const selectedCartItems = items.filter(
    (item) => !isItemUnavailable(item) && selectedItems[getProductId(item)] !== false,
  );
  const total = useMemo(
    () =>
      selectedCartItems.reduce(
        (sum, item) => sum + item.productId.productPrice * item.quantity,
        0,
      ),
    [selectedCartItems],
  );
  const itemCount = useMemo(
    () => selectedCartItems.reduce((count, item) => count + item.quantity, 0),
    [selectedCartItems],
  );
  const updateQuantity = async (item, quantity) => {
    if (!item.productId) return;
    const currentQuantity = (cartRef.current || cart)?.cartItems
      ?.find((currentItem) => currentItem.productId._id === item.productId._id)?.quantity;
    if (quantity > currentQuantity && quantity > item.productId.stockQuantity) {
      setMessage(`Only ${item.productId.stockQuantity} item(s) are currently available. Decrease the quantity to continue.`);
      return;
    }
    const currentCart = cartRef.current || cart;
    const currentItems = currentCart?.cartItems ?? [];
    const nextCart = {
      ...(currentCart || {}),
      cartItems: currentItems
        .map((currentItem) => ({
          ...currentItem,
          quantity: currentItem.productId._id === item.productId._id
            ? quantity
            : currentItem.quantity,
        }))
        .filter((currentItem) => currentItem.quantity > 0),
    };
    cartRef.current = nextCart;
    setCart(nextCart);
    saveQueueRef.current = saveQueueRef.current.then(async () => {
      saveInProgressRef.current = true;
      try {
        const response = await fetch(apiUrl(`cart/${user._id}`), {
          method: "PUT",
          headers: authHeaders(token),
          body: JSON.stringify({
            cartItems: (cartRef.current?.cartItems || []).map(({ productId, quantity }) => ({
              productId: productId._id,
              quantity,
            })),
          }),
        });
        const data = await response.json();
        if (!response.ok) return setMessage(data.message || "Unable to update your cart.");
        setMessage("");
      } catch {
        setMessage("Unable to update your cart.");
      } finally {
        saveInProgressRef.current = false;
      }
    });
    await saveQueueRef.current;
  };
  const checkout = async () => {
    if (!selectedCartItems.length) {
      setMessage("Select at least one available item to place an order.");
      return;
    }
    await saveQueueRef.current;
    const orderItems = selectedCartItems.map(({ productId, quantity }) => ({
      productId: productId._id,
      productName: productId.productName,
      productPrice: productId.productPrice,
      quantity,
    }));
    const response = await fetch(apiUrl("order"), {
      method: "POST",
      headers: authHeaders(token),
      body: JSON.stringify({
        orderItems,
        totalAmount: total,
        pickupDetails: "NU Manila Campus Store",
      }),
    });
    const data = await response.json();
    if (!response.ok)
      return setMessage(data.message || "Unable to place order.");
    const remainingItems = items.filter(
      (item) => !selectedCartItems.some((selected) => getProductId(selected) === getProductId(item)),
    );
    await fetch(apiUrl(`cart/${user._id}`), {
      method: "PUT",
      headers: authHeaders(token),
      body: JSON.stringify({
        cartItems: remainingItems.map(({ productId, quantity }) => ({
          productId: productId._id,
          quantity,
        })),
      }),
    });
    const remainingCart = { ...(cartRef.current || {}), cartItems: remainingItems };
    setCart(remainingCart);
    cartRef.current = remainingCart;
    setSelectedItems({});
    window.dispatchEvent(new CustomEvent("cart-updated", {
      detail: { cartCount: remainingItems.reduce((count, item) => count + item.quantity, 0) },
    }));
    window.dispatchEvent(new Event("orders-updated"));
    setMessage("Order placed successfully. You can now track it in My Orders.");
  };
  return (
    <div className="min-h-screen bg-zinc-100 px-4 py-8 sm:px-6">
      <main className="mx-auto max-w-5xl">
        <section className="rounded-3xl border-2 border-zinc-900 bg-blue-950 p-6 text-white sm:p-8">
          <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-yellow-400">
            Customer cart
          </p>
          <h1 className="mt-2 text-3xl font-bold sm:text-4xl">
            Ready when you are.
          </h1>
          <p className="mt-3 text-sm text-blue-100">
            Review your campus essentials, then send your order for admin
            confirmation.
          </p>
        </section>
        {message && (
          <p className="mt-5 rounded-xl border border-blue-200 bg-blue-50 p-3 text-sm text-blue-950">
            {message}
          </p>
        )}
        {!cart ? (
          <p className="mt-6 text-zinc-600">Loading your cart…</p>
        ) : !items.length ? (
          <section className="mt-6 rounded-3xl border-2 border-zinc-900 bg-white p-8 text-center">
            <h2 className="text-xl font-bold">Your cart is empty</h2>
            <p className="mt-2 text-sm text-zinc-600">
              Find an NU item you like and add it here.
            </p>
            <Link
              to="/products"
              className="mt-5 inline-block rounded-full bg-blue-950 px-5 py-3 text-xs font-bold uppercase tracking-wider text-white"
            >
              Browse products
            </Link>
          </section>
        ) : (
          <section className="mt-6 grid gap-6 lg:grid-cols-[1.3fr_.7fr]">
            <div className="space-y-3">
              {items.map(({ productId, quantity }) => {
                const itemId = String(productId?._id || productId);
                const isUnavailable = !productId || productId.stockQuantity < quantity;
                return (
                <article
                  key={itemId}
                  className={`grid gap-4 rounded-2xl border-2 p-4 sm:grid-cols-[7rem_minmax(0,1fr)_auto] sm:items-center sm:p-5 ${isUnavailable ? "border-zinc-400 bg-zinc-200 opacity-70" : "border-zinc-900 bg-white"}`}
                >
                  <div className="flex h-28 w-full items-center justify-center overflow-hidden rounded-xl border border-zinc-200 bg-zinc-50 p-2 sm:h-28 sm:w-28">
                    {resolveProductImage(productId?.productImage) ? (
                      <img
                        src={resolveProductImage(productId.productImage)}
                        alt={productId?.productName || "Unavailable product"}
                        className="h-full w-full object-contain"
                      />
                    ) : (
                      <span className="text-center text-[10px] font-semibold uppercase tracking-wider text-zinc-400">No image</span>
                    )}
                  </div>
                  <div className="min-w-0">
                    <label className="mb-3 flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-zinc-600">
                      <input
                        type="checkbox"
                        checked={!isUnavailable && selectedItems[itemId] !== false}
                        disabled={!productId || quantity <= 0}
                        onChange={() => setSelectedItems((current) => ({ ...current, [itemId]: current[itemId] === false }))}
                        className="h-4 w-4 cursor-pointer accent-blue-950"
                        aria-label={`Select ${productId?.productName || "unavailable product"} for order`}
                      />
                      Select for order
                    </label>
                    <h2 className="font-bold">{productId?.productName || "Unavailable product"}</h2>
                    <p className="mt-1 text-sm text-zinc-600">
                      PHP {productId?.productPrice?.toLocaleString() || "—"} each
                    </p>
                    <p className="mt-1 text-xs font-semibold uppercase tracking-wider text-zinc-500">
                      {isUnavailable
                        ? productId?.stockQuantity > 0
                          ? `Only ${productId.stockQuantity} available. Try adjusting the quantity.`
                          : "No longer available / out of stock"
                        : `${productId.stockQuantity} available`}
                    </p>
                  </div>
                  <div className="flex items-center justify-between gap-4 sm:block sm:text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        type="button"
                        onClick={() => updateQuantity({ productId }, quantity - 1)}
                        disabled={!productId}
                        aria-label={`Decrease ${productId?.productName || "unavailable product"} quantity`}
                        className="h-9 w-9 cursor-pointer rounded-lg border-2 border-zinc-900 text-lg font-bold leading-none transition hover:bg-zinc-100 disabled:cursor-not-allowed disabled:border-zinc-400 disabled:bg-zinc-300 disabled:text-zinc-500 disabled:opacity-100"
                      >
                        -
                      </button>
                      <span className="min-w-8 text-center text-sm font-bold">{quantity}</span>
                      <button
                        type="button"
                        onClick={() => updateQuantity({ productId }, quantity + 1)}
                        disabled={!productId || quantity >= productId.stockQuantity}
                        aria-label={`Increase ${productId?.productName || "unavailable product"} quantity`}
                        className="h-9 w-9 cursor-pointer rounded-lg border-2 border-zinc-900 text-lg font-bold leading-none transition hover:bg-zinc-100 disabled:cursor-not-allowed disabled:border-zinc-400 disabled:bg-zinc-300 disabled:text-zinc-500 disabled:opacity-100"
                      >
                        +
                      </button>
                    </div>
                    <button
                      type="button"
                      onClick={() => updateQuantity({ productId }, 0)}
                      disabled={false}
                      className="mt-2 cursor-pointer text-xs font-bold uppercase tracking-wider text-red-700 underline underline-offset-4 transition hover:text-red-900 disabled:cursor-not-allowed disabled:opacity-40"
                    >
                      Remove
                    </button>
                    <p className="mt-1 font-bold">
                      PHP {productId ? (productId.productPrice * quantity).toLocaleString() : "—"}
                    </p>
                  </div>
                </article>
                );
              })}
            </div>
            <aside className="h-fit rounded-3xl border-2 border-zinc-900 bg-white p-5">
              <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-zinc-500">
                Order summary
              </p>
              <div className="mt-5 space-y-3 border-b border-zinc-300 pb-4">
                <div className="flex justify-between text-sm text-zinc-600">
                  <span>Items ({itemCount})</span>
                  <span>{selectedCartItems.length} product{selectedCartItems.length === 1 ? "" : "s"}</span>
                </div>
                {selectedCartItems.map(({ productId, quantity }) => (
                  <div key={productId._id} className="flex justify-between gap-4 text-sm">
                    <span className="min-w-0">
                      {productId?.productName || "Unavailable product"} <span className="text-zinc-500">× {quantity}</span>
                    </span>
                    <span className="shrink-0 font-semibold">
                      PHP {productId ? (productId.productPrice * quantity).toLocaleString() : "—"}
                    </span>
                  </div>
                ))}
              </div>
              <div className="mt-4 space-y-2 border-b border-zinc-300 pb-4 text-sm">
                <div className="flex justify-between">
                  <span>Subtotal</span>
                  <span>PHP {total.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-zinc-600">
                  <span>Pickup fee</span>
                  <span>Free</span>
                </div>
                <div className="flex justify-between pt-2 text-base font-bold">
                  <span>Total</span>
                  <span>PHP {total.toLocaleString()}</span>
                </div>
              </div>
              <div className="mt-4 space-y-1 text-sm leading-6 text-zinc-600">
                <p><span className="font-semibold text-zinc-800">Pickup location:</span> NU Manila Campus Store</p>
                <p><span className="font-semibold text-zinc-800">Customer:</span> {user?.firstName} {user?.lastName}</p>
                <p><span className="font-semibold text-zinc-800">Contact:</span> {user?.contactNumber || "Not provided"}</p>
                <p><span className="font-semibold text-zinc-800">Address:</span> {user?.address || "Not provided"}</p>
                <p className="pt-2">An admin will confirm and prepare your order.</p>
              </div>
              <button
                onClick={() => setShowOrderPrompt(true)}
                className="mt-5 w-full cursor-pointer rounded-full bg-yellow-400 px-4 py-3 text-xs font-bold uppercase tracking-wider text-blue-950 shadow-sm transition duration-200 hover:-translate-y-0.5 hover:bg-yellow-300 hover:shadow-lg active:translate-y-0 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Place order
              </button>
              <Link
                to="/orders"
                className="mt-3 block text-center text-sm font-semibold text-blue-950 underline"
              >
                View my orders
              </Link>
            </aside>
          </section>
        )}
      </main>
      {showOrderPrompt && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-blue-950/70 px-4 py-6"
          role="presentation"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) setShowOrderPrompt(false);
          }}
        >
          <section
            className="w-full max-w-md border-2 border-zinc-900 bg-zinc-50 p-6 text-zinc-900 shadow-2xl sm:p-8"
            role="dialog"
            aria-modal="true"
            aria-labelledby="order-prompt-title"
          >
            <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-zinc-500">
              Order confirmation
            </p>
            <h2 id="order-prompt-title" className="mt-2 text-2xl font-bold text-blue-950">
              Place this order?
            </h2>
            <p className="mt-3 text-sm leading-6 text-zinc-600">
              Please confirm your {selectedCartItems.length} cart item{selectedCartItems.length === 1 ? "" : "s"} for a total of PHP {total.toLocaleString()}. An admin will review it for pickup.
            </p>
            <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-end">
              <button
                type="button"
                onClick={() => setShowOrderPrompt(false)}
                className="cursor-pointer rounded-xl border-2 border-zinc-900 px-4 py-3 text-xs font-bold uppercase tracking-wider text-zinc-900 transition hover:bg-zinc-100"
              >
                Review cart
              </button>
              <button
                type="button"
                onClick={() => { setShowOrderPrompt(false); void checkout(); }}
                className="cursor-pointer rounded-xl border-2 border-blue-950 bg-blue-950 px-4 py-3 text-xs font-bold uppercase tracking-wider text-white transition hover:border-black hover:bg-black"
              >
                Confirm order
              </button>
            </div>
          </section>
        </div>
      )}
    </div>
  );
}
