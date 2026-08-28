import ProductCard from './ProductCard';

const ProductList = ({ products, returnTo }) => {
  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
      {products.map((product, index) => (
        <ProductCard
          key={product.productSlug || product.name || product._id || `${product.productName || product.title || 'product'}-${index}`}
          product={product}
          index={index}
          returnTo={returnTo}
        />
      ))}
    </div>
  );
};

export default ProductList;
