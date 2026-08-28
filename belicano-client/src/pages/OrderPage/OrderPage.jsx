import { useCallback, useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { authHeaders, useAuth } from "../../context/useAuth.js";
import { apiUrl } from "../../config/api.js";

const statusStyle = {
  Pending: "bg-yellow-100 text-yellow-900",
  Processing: "bg-blue-100 text-blue-900",
  "Ready for pickup": "bg-green-100 text-green-900",
  Completed: "bg-zinc-200 text-zinc-800",
  Cancelled: "bg-red-100 text-red-900",
};
const normalizeStatus = (status) => String(status || "").trim().toLowerCase();

export default function OrderPage() {
  const { user, token } = useAuth();
  const navigate = useNavigate();
  const [orders, setOrders] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [drafts, setDrafts] = useState({});
  const [message, setMessage] = useState("");
  const [confirmation, setConfirmation] = useState(null);
  const load = useCallback(async () => {
    const [orderResponse, reviewResponse] = await Promise.all([
      fetch(apiUrl(`order${user?.userRole === "admin" ? "?mine=true" : ""}`), { headers: authHeaders(token) }),
      fetch(apiUrl("review")),
    ]);
    if (!orderResponse.ok) throw Error();
    setOrders(await orderResponse.json());
    if (reviewResponse.ok) setReviews(await reviewResponse.json());
    window.dispatchEvent(new Event("orders-updated"));
  }, [token, user?.userRole]);
  useEffect(() => {
    if (!user) navigate("/auth/signin", { state: { from: "/orders" } });
    else if (!["customer", "admin"].includes(user.userRole)) navigate("/");
    else {
      void Promise.resolve()
        .then(load)
        .catch(() => setMessage("Unable to load your orders."));
      const refreshTimer = window.setInterval(() => {
        void load().catch(() => {});
      }, 3000);
      return () => window.clearInterval(refreshTimer);
    }
    return undefined;
  }, [user, navigate, load]);
  const updateStatus = async (order, orderStatus) => {
    const response = await fetch(apiUrl(`order/${order._id}/customer-status`), {
      method: "PUT",
      headers: authHeaders(token),
      body: JSON.stringify({ orderStatus }),
    });
    const data = await response.json();
    if (!response.ok)
      return setMessage(data.message || "Unable to update order.");
    setMessage(
      orderStatus === "Completed"
        ? "Order marked as received. You can optionally leave a review below."
        : "Order cancelled.",
    );
    load();
  };
  const productKey = (item) => String(item.productId?._id || item.productId);
  const hasReviewed = (productId, orderId) =>
    reviews.some(
      (review) =>
        String(review.productId?._id || review.productId) === String(productId) &&
        String(review.orderId?._id || review.orderId) === String(orderId) &&
        String(review.userId?._id || review.userId) === String(user._id),
    );
  const submitReview = async (productId, orderId, draftKey) => {
    const draft = drafts[draftKey] || { reviewRating: 5, reviewComment: "" };
    const rating = Number(draft.reviewRating);
    if (!Number.isInteger(rating) || rating < 1 || rating > 5)
      return setMessage("Please choose a rating from 1 to 5.");
    const response = await fetch(apiUrl("review"), {
      method: "POST",
      headers: authHeaders(token),
      body: JSON.stringify({
        productId,
        orderId,
        reviewRating: rating,
        reviewComment: draft.reviewComment?.trim() || "",
      }),
    });
    const data = await response.json();
    if (!response.ok)
      return setMessage(data.message || "Unable to submit review.");
    setMessage("Thanks! Your review was submitted.");
    setDrafts((current) => ({ ...current, [draftKey]: { reviewRating: 5, reviewComment: "" } }));
    load();
  };
  return (
    <div className="min-h-screen bg-zinc-100 px-4 py-8 sm:px-6">
      <main className="mx-auto max-w-5xl">
        <section className="rounded-3xl border-2 border-zinc-900 bg-blue-950 p-6 text-white sm:p-8">
          <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-yellow-400">
            Order tracking
          </p>
          <h1 className="mt-2 text-3xl font-bold sm:text-4xl">My orders</h1>
          <p className="mt-3 text-sm text-blue-100">
            Follow every order from confirmation through campus pickup.
          </p>
        </section>
        {message && (
          <p className="mt-5 rounded-xl border border-blue-200 bg-blue-50 p-3 text-sm text-blue-950">
            {message}
          </p>
        )}
        {!orders.length ? (
          <section className="mt-6 rounded-3xl border-2 border-zinc-900 bg-white p-8 text-center">
            <h2 className="text-xl font-bold">No orders yet</h2>
            <p className="mt-2 text-sm text-zinc-600">
              Your placed orders will appear here.
            </p>
            <Link
              to="/products"
              className="mt-5 inline-block rounded-full bg-blue-950 px-5 py-3 text-xs font-bold uppercase tracking-wider text-white"
            >
              Browse products
            </Link>
          </section>
        ) : (
          <section className="mt-6 space-y-4">
            {orders.map((order) => (
              <article
                key={order._id}
                className="rounded-3xl border-2 border-zinc-900 bg-white p-5"
              >
                <div className="flex flex-col gap-3 border-b border-zinc-300 pb-4 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wider text-zinc-500">
                      Order #{order._id.slice(-6).toUpperCase()}
                    </p>
                    <h2 className="mt-1 text-lg font-bold">
                      PHP {order.totalAmount.toLocaleString()}
                    </h2>
                  </div>
                  <span
                    className={`w-fit rounded-full px-3 py-1 text-xs font-bold ${statusStyle[order.orderStatus]}`}
                  >
                    {order.orderStatus}
                  </span>
                </div>
                <div className="mt-4 space-y-2 text-sm text-zinc-700">
                  {order.orderItems.map((item) => (
                    <p key={item.productId}>
                      {item.productName} × {item.quantity}{" "}
                      <span className="float-right">
                        PHP{" "}
                        {(item.productPrice * item.quantity).toLocaleString()}
                      </span>
                    </p>
                  ))}
                </div>
                <p className="mt-4 text-sm text-zinc-600">
                  Pickup location:{" "}
                  {order.pickupDetails || "NU Manila Campus Store"}
                </p>
                <div className="mt-2 space-y-1 text-sm text-zinc-600">
                  <p>Contact: {order.userId?.contactNumber || user?.contactNumber || "Not provided"}</p>
                  <p>Address: {order.userId?.address || user?.address || "Not provided"}</p>
                </div>
                <div className="mt-5 flex flex-wrap gap-3">
                  {normalizeStatus(order.orderStatus) === "ready for pickup" && (
                    <button
                      onClick={() => setConfirmation({ order, orderStatus: "Completed" })}
                      className="rounded-full bg-yellow-400 px-4 py-3 text-xs font-bold uppercase tracking-wider text-blue-950"
                    >
                      Confirm order received
                    </button>
                  )}
                    {normalizeStatus(order.orderStatus) === "pending" && (
                    <button
                      onClick={() => setConfirmation({ order, orderStatus: "Cancelled" })}
                      className="rounded-full border-2 border-red-700 px-4 py-3 text-xs font-bold uppercase tracking-wider text-red-700"
                    >
                      Cancel order
                    </button>
                  )}
                </div>
                {order.orderStatus === "Completed" && (
                  <div className="mt-5 space-y-3 border-t border-zinc-300 pt-4">
                    <p className="text-sm font-semibold text-zinc-800">
                      Optional review
                    </p>
                    {order.orderItems.map((item) => {
                      const id = productKey(item);
                      const draftKey = `${order._id}-${id}`;
                      const draft = drafts[draftKey] || { reviewRating: 5, reviewComment: "" };
                      return (
                        <div key={draftKey} className="rounded-xl border border-zinc-300 p-4">
                          <p className="text-sm font-medium">{item.productName}</p>
                          {hasReviewed(id, order._id) ? (
                            <p className="mt-2 text-sm text-zinc-600">
                              You already reviewed this product.
                            </p>
                          ) : (
                            <>
                              <select
                                className="mt-3 w-full rounded-xl border border-zinc-300 bg-white px-3 py-2 text-sm"
                                value={draft.reviewRating}
                                onChange={(e) =>
                                  setDrafts({
                                    ...drafts,
                                    [draftKey]: { ...draft, reviewRating: Number(e.target.value) },
                                  })
                                }
                                aria-label={`Rating for ${item.productName}`}
                              >
                                {[5, 4, 3, 2, 1].map((value) => (
                                  <option key={value} value={value}>
                                    {value} / 5
                                  </option>
                                ))}
                              </select>
                              <textarea
                                className="mt-2 w-full rounded-xl border border-zinc-300 bg-white px-3 py-2 text-sm"
                                placeholder="Share optional feedback"
                                value={draft.reviewComment}
                                onChange={(e) =>
                                  setDrafts({
                                    ...drafts,
                                    [draftKey]: { ...draft, reviewComment: e.target.value },
                                  })
                                }
                              />
                              <button
                                onClick={() => submitReview(id, order._id, draftKey)}
                                className="mt-3 rounded-full bg-blue-950 px-4 py-2 text-xs font-bold uppercase tracking-wider text-white"
                              >
                                Submit rating
                              </button>
                            </>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </article>
            ))}
          </section>
        )}
      </main>
      {confirmation && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-blue-950/70 px-4 py-6"
          role="presentation"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) setConfirmation(null);
          }}
        >
          <section
            className="w-full max-w-md border-2 border-zinc-900 bg-zinc-50 p-6 text-zinc-900 shadow-2xl sm:p-8"
            role="dialog"
            aria-modal="true"
            aria-labelledby="order-status-confirmation-title"
          >
            <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-zinc-500">
              Order update
            </p>
            <h2 id="order-status-confirmation-title" className="mt-2 text-2xl font-bold text-blue-950">
              {confirmation.orderStatus === "Cancelled" ? "Cancel this order?" : "Confirm order received?"}
            </h2>
            <p className="mt-3 text-sm leading-6 text-zinc-600">
              {confirmation.orderStatus === "Cancelled"
                ? "This order will be cancelled and cannot be restored."
                : "Confirm that you have received this order. This will complete the order."}
            </p>
            <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-end">
              <button
                type="button"
                onClick={() => setConfirmation(null)}
                className="cursor-pointer rounded-xl border-2 border-zinc-900 px-4 py-3 text-xs font-bold uppercase tracking-wider text-zinc-900 transition hover:bg-zinc-100"
              >
                Go back
              </button>
              <button
                type="button"
                onClick={() => {
                  const { order, orderStatus } = confirmation;
                  setConfirmation(null);
                  void updateStatus(order, orderStatus);
                }}
                className={`cursor-pointer rounded-xl border-2 px-4 py-3 text-xs font-bold uppercase tracking-wider text-white transition hover:border-black hover:bg-black ${confirmation.orderStatus === "Cancelled" ? "border-red-700 bg-red-700" : "border-blue-950 bg-blue-950"}`}
              >
                {confirmation.orderStatus === "Cancelled" ? "Confirm cancellation" : "Confirm receipt"}
              </button>
            </div>
          </section>
        </div>
      )}
    </div>
  );
}
