import { useEffect, useState } from 'react';
import { useLocation, useSearchParams } from 'react-router-dom';
import Button from '../../components/Button.jsx';
import Pagination from '../../components/Pagination.jsx';
import { paginate } from '../../utils/pagination.js';
import ProductList from '../../components/ProductList.jsx';
import fallbackProducts, { fetchProducts } from '../../assets/product-content.js';

const ProductListPage = () => {
  const [products, setProducts] = useState(fallbackProducts);
  const location = useLocation();
  const [searchParams, setSearchParams] = useSearchParams();
  const [search, setSearch] = useState(searchParams.get('search') || '');
  const [category, setCategory] = useState(searchParams.get('category') || 'All');
  const [page, setPage] = useState(Number(searchParams.get('page')) || 1);
  const updateProductsView = (next) => {
    setSearchParams({
      ...(next.search ? { search: next.search } : {}),
      ...(next.category && next.category !== 'All' ? { category: next.category } : {}),
      ...(next.page > 1 ? { page: String(next.page) } : {}),
    });
  };
  const changePage = (nextPage) => {
    setPage(nextPage);
    updateProductsView({ search, category, page: nextPage });
    requestAnimationFrame(() => window.scrollTo({ top: 0, behavior: 'smooth' }));
  };

  useEffect(() => {
    fetchProducts()
      .then(setProducts)
      .catch(() => setProducts(fallbackProducts));
  }, []);
  useEffect(() => {
    if (!location.state?.restoreScroll) return;
    const savedPosition = Number(sessionStorage.getItem('products-scroll-position'));
    requestAnimationFrame(() => window.scrollTo({ top: Number.isFinite(savedPosition) ? savedPosition : 0, behavior: 'smooth' }));
  }, [location.state]);

  const categories = ['All', ...new Set(products.map((product) => product.categoryId?.categoryName || product.category).filter(Boolean))];
  const filteredProducts = products.filter((product) => {
    if (product.isActive === false) return false;
    const name = product.productName || product.name || '';
    const productCategory = product.categoryId?.categoryName || product.category;
    return name.toLowerCase().includes(search.toLowerCase()) && (category === 'All' || productCategory === category);
  });
  const paged = paginate(filteredProducts, page);
  return (
    <div className="flex w-full flex-col gap-6">
      <section className="border-y-2 border-zinc-900 bg-zinc-50 px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
        <p className="mb-3 text-[11px] font-semibold uppercase tracking-[0.28em] text-zinc-500">
          Products
        </p>
        <h1 className="max-w-xl text-3xl font-bold leading-tight text-zinc-900 sm:text-4xl">
          Shop campus essentials in a simple product grid
        </h1>
        <p className="mt-4 max-w-lg text-sm leading-7 text-zinc-600 sm:text-base">
          Browse practical items for class, study, commute, and everyday campus routines.
        </p>
        <div className="mt-6">
          <Button to="/">Back Home</Button>
        </div>
      </section>

      <section className="border-y-2 border-zinc-900 bg-zinc-50 px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
        <div className="mb-6">
          <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-zinc-500">
            Featured Products
          </p>
          <h2 className="mt-2 text-2xl font-semibold text-zinc-900">Product card grid</h2>
        </div>

        <div className="mb-5 flex flex-col gap-3 sm:flex-row">
          <input value={search} onChange={(event) => { const value = event.target.value; setSearch(value); setPage(1); updateProductsView({ search: value, category, page: 1 }); }} className="rounded-xl border-2 border-zinc-900 px-4 py-2" placeholder="Search products" aria-label="Search products" />
          <select value={category} onChange={(event) => { const value = event.target.value; setCategory(value); setPage(1); updateProductsView({ search, category: value, page: 1 }); }} className="rounded-xl border-2 border-zinc-900 px-4 py-2" aria-label="Filter by category">
            {categories.map((item) => <option key={item}>{item}</option>)}
          </select>
        </div>
        {filteredProducts.length ? (
          <>
            <ProductList products={paged.items} returnTo={`${location.pathname}${location.search}`} />
            <Pagination page={paged.current} pageCount={paged.pageCount} onPageChange={changePage} />
          </>
        ) : <p className="text-zinc-600">No products match your search.</p>}
      </section>
    </div>
  );
}

export default ProductListPage
