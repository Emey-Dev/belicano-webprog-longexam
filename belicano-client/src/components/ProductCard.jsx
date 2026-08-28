import Button from './Button';
import { resolveProductImage } from '../assets/product-content.js';

const ProductCard = ({ product, index, returnTo }) => {
  const productName = product.productName || product.title || product.name || 'Product';
  const productSlug = product.productSlug || product.name || productName.toLowerCase().replace(/\s+/g, '-');
  const productCategory = product.categoryId?.categoryName || product.category || 'Apparel';
  const productPrice =
    typeof product.productPrice === 'number'
      ? `PHP ${new Intl.NumberFormat('en-PH').format(product.productPrice)}`
      : product.price || 'PHP 0';
  const productStock = product.stockStatus || product.stock || 'In stock';
  const productImage =
    resolveProductImage(product.productImage || product.image) ||
    'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?auto=format&fit=crop&w=900&q=80';
  const previewText =
    Array.isArray(product.content) && product.content.length > 0
      ? product.content[0]
      : product.productDescription || product.description || 'Campus essentials made for everyday use.';

  return (
    <article className="flex h-full flex-col rounded-3xl border-2 border-zinc-900 bg-white p-4 shadow-sm transition hover:-translate-y-1 hover:shadow-lg">
      <div className="flex aspect-[4/3] items-center justify-center overflow-hidden rounded-[1.25rem] border border-zinc-200 bg-white p-3">
        <img
          src={productImage}
          alt={productName}
          className="h-full w-full object-contain"
        />
      </div>
      <p className="mt-4 text-[11px] font-semibold uppercase tracking-[0.24em] text-zinc-500">
        {productCategory} {String(index + 1).padStart(2, '0')}
      </p>
      <h3 className="mt-2 min-h-14 text-lg font-semibold text-zinc-900">{productName}</h3>
      <p className="mt-2 text-base font-bold text-zinc-900">{productPrice}</p>
      <p className="mt-1 text-xs font-medium text-zinc-500">{productStock}</p>
      <p className="mt-3 flex-1 text-sm leading-6 text-zinc-600">
        {previewText.substring(0, 120)}{previewText.length > 120 ? '...' : ''}
      </p>
      <Button
        to={`/products/${productSlug}`}
        state={{ from: returnTo, restoreScroll: true }}
        onClick={() => sessionStorage.setItem('products-scroll-position', String(window.scrollY))}
        className="mt-5 w-full text-center"
      >
        View Product
      </Button>
    </article>
  );
};

export default ProductCard;
