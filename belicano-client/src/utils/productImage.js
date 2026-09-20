const imageModules = import.meta.glob("../assets/img/*", {
  eager: true,
  import: "default",
});
const apiBaseUrl = (import.meta.env.VITE_API_URL || "/api").replace(/\/$/, "");

export const resolveProductImage = (imageName) => {
  if (!imageName) return "";
  if (imageName.startsWith("http") || imageName.startsWith("/")) return imageName;
  const imagePath = Object.keys(imageModules).find((path) =>
    path.endsWith(`/${imageName}`),
  );
  return imagePath ? imageModules[imagePath] : "";
};

export const fetchProducts = async () => {
  const response = await fetch(`${apiBaseUrl}/products`);
  if (!response.ok) throw new Error("Failed to fetch products");
  const payload = await response.json();
  const products = Array.isArray(payload) ? payload : payload.data;
  if (!Array.isArray(products)) throw new Error("Invalid products response");
  return products;
};
