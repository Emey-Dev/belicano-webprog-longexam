const imageModules = import.meta.glob("./img/*", {
  eager: true,
  import: "default",
});
const apiBaseUrl = (import.meta.env.VITE_API_URL || "/api").replace(/\/$/, "");

export const resolveProductImage = (imageName) => {
  if (!imageName) return "";
  if (imageName.startsWith("http") || imageName.startsWith("/"))
    return imageName;
  const imagePath = Object.keys(imageModules).find((path) =>
    path.endsWith(`/${imageName}`),
  );
  return imagePath ? imageModules[imagePath] : "";
};

export const fetchProducts = async () => {
  const response = await fetch(`${apiBaseUrl}/products`);
  if (!response.ok) throw new Error("Failed to fetch products");
  const payload = await response.json();
  const data = Array.isArray(payload) ? payload : payload.data;
  if (!Array.isArray(data)) throw new Error("Invalid products response");
  return data;
};

const products = [
  [
    "NU Athletic Tee",
    "nu-athletic-tee",
    "A lightweight National University athletic tee for everyday campus wear.",
    550,
    "nu_athleticV1-apparel.jpg",
    "Apparel",
  ],
  [
    "NU Classic Shirt",
    "nu-classic-shirt",
    "Classic NU shirt with a clean varsity-inspired finish.",
    500,
    "nu_classic-apparel.jpg",
    "Apparel",
    false,
  ],
  [
    "NU Dri-Fit Shirt",
    "nu-dri-fit-shirt",
    "Breathable Dri-Fit shirt for training, PE, and active days.",
    650,
    "nu_drifitV1-apparel.jpg",
    "Apparel",
    false,
  ],
  [
    "NU Hoodie",
    "nu-hoodie",
    "Warm NU hoodie for cooler classrooms and rainy commutes.",
    1200,
    "nu_hoodieV1-apparel.jpg",
    "Apparel",
  ],
  [
    "NU Sweatshirt",
    "nu-sweatshirt",
    "Comfortable National University sweatshirt with a relaxed fit.",
    950,
    "nu_sweatshirtV1-apparel.webp",
    "Apparel",
  ],
  [
    "NU Volleyball Shirt",
    "nu-volleyball-shirt",
    "Volleyball-inspired NU shirt for Bulldog supporters.",
    700,
    "nu_volleyballV1-apparel.jpg",
    "Apparel",
  ],
  [
    "NU Basketball Shirt",
    "nu-basketball-shirt",
    "Basketball-inspired apparel for game days and campus events.",
    700,
    "nu_basketballV2-apparel.jpg",
    "Apparel",
    false,
  ],
  [
    "NU Shirt",
    "nu-shirt",
    "Everyday NU shirt made for a simple campus look.",
    450,
    "nu_shirt-apparel.jpg",
    "Apparel",
  ],
  [
    "NU Lanyard",
    "nu-lanyard",
    "Durable NU lanyard for campus IDs and keys.",
    120,
    "nu_lanyardV1_accessories.webp",
    "Accessories",
  ],
  [
    "NU Scarf",
    "nu-scarf",
    "National University scarf for school spirit and game days.",
    350,
    "nu_scarftv1-accessories.webp",
    "Accessories",
  ],
  [
    "NU Keychain",
    "nu-keychain",
    "Compact NU keychain for keys, bags, and collectibles.",
    95,
    "nu_keychainV1_accessories.webp",
    "Accessories",
  ],
  [
    "NU Sticker Pack",
    "nu-sticker-pack",
    "A set of NU stickers for laptops, bottles, and notebooks.",
    80,
    "nu_stickerV3_accessories.webp",
    "Accessories",
  ],
  [
    "NU Baller Accessory",
    "nu-baller-accessory",
    "NU-themed accessory for students and Bulldog fans.",
    250,
    "nu_baller_accessories.webp",
    "Accessories",
  ],
].map(
  ([
    productName,
    productSlug,
    productDescription,
    productPrice,
    productImage,
    category,
    isActive = true,
  ]) => ({
    productName,
    productSlug,
    productDescription,
    productPrice,
    productImage,
    category,
    isActive,
    stockStatus: "In stock",
  }),
);

export default products;
