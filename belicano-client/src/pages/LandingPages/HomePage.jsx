import { useEffect, useState } from 'react';
import Button from '../../components/Button';
import banner from '../../assets/img/nu_bulldogex_banner.jpg';
import { fetchProducts } from '../../utils/productImage.js';
import { resolveProductImage } from '../../utils/productImage.js';

const HomePage = () => {
    const [catalog, setCatalog] = useState([]);
        const [stats, setStats] = useState({ products: 0, orderedItems: 0, reviewedItems: 0, activeUsers: 0 });
    useEffect(() => {
        fetchProducts().then(setCatalog).catch(() => setCatalog([]));
            fetch(`${(import.meta.env.VITE_API_URL || "/api").replace(/\/$/, "")}/public-stats`).then((response) => response.ok ? response.json() : Promise.reject()).then(setStats).catch(() => {});
    }, []);
    const activeProducts = catalog.filter((product) => product.isActive !== false);
    const bestsellers = [...activeProducts]
        .sort((left, right) => (right.soldQuantity || 0) - (left.soldQuantity || 0))
        .slice(0, 5);

    return (
        <div className="flex w-full flex-col gap-6">
            <section className="relative min-h-[28rem] overflow-hidden border-y-2 border-zinc-900 bg-zinc-900 px-4 py-10 sm:px-6 lg:px-8">
                <img
                    src={banner}
                    alt=""
                    className="absolute inset-0 h-full w-full object-cover"
                />
                <div className="absolute inset-0 bg-zinc-900/45" />

                <div className="relative z-10 flex min-h-[22rem] items-start justify-end text-right sm:min-h-[24rem]">
                    <div className="max-w-xl">
                        <p className="mb-3 text-[11px] font-semibold uppercase tracking-[0.28em] text-zinc-200">
                            Campus Marketplace
                        </p>
                        <h1 className="text-3xl font-bold leading-tight text-zinc-50 sm:text-4xl">
                            Welcome to BulldogEx Shop
                        </h1>
                        <p className="mt-4 text-sm leading-7 text-zinc-100 sm:text-base">
                            Explore campus uniforms, student essentials, and school merch in one
                            quick storefront.
                        </p>
                        <div className="mt-6 flex flex-wrap justify-end gap-3">
                            <Button to="/products">
                                Shop Now
                            </Button>
                            <Button to="/about" variant="primary">
                                About Store
                            </Button>
                        </div>
                    </div>
                </div>
            </section>

            <section className="border-y-2 border-zinc-900 bg-zinc-50 px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
                <div className="mb-6">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-zinc-500">
                        Store Overview
                    </p>
                    <h2 className="mt-2 text-2xl font-semibold text-zinc-900">Quick shopping blocks</h2>
                </div>

                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                    <div className="rounded-3xl border-2 border-zinc-900 bg-zinc-100 p-5">
                            <p className="text-2xl font-bold text-zinc-900">{stats.products || activeProducts.length}</p>
                        <p className="mt-2 text-[11px] font-semibold uppercase tracking-[0.24em] text-zinc-500">
                            Products
                        </p>
                    </div>
                    <div className="rounded-3xl border-2 border-zinc-900 bg-zinc-100 p-5">
                            <p className="text-2xl font-bold text-zinc-900">{stats.orderedItems}</p>
                        <p className="mt-2 text-[11px] font-semibold uppercase tracking-[0.24em] text-zinc-500">
                            Ordered items
                        </p>
                    </div>
                    <div className="rounded-3xl border-2 border-zinc-900 bg-zinc-100 p-5">
                            <p className="text-2xl font-bold text-zinc-900">{stats.reviewedItems}</p>
                        <p className="mt-2 text-[11px] font-semibold uppercase tracking-[0.24em] text-zinc-500">
                            Reviewed items
                        </p>
                    </div>
                    <div className="rounded-3xl border-2 border-zinc-900 bg-zinc-100 p-5">
                            <p className="text-2xl font-bold text-zinc-900">{stats.activeUsers}</p>
                        <p className="mt-2 text-[11px] font-semibold uppercase tracking-[0.24em] text-zinc-500">
                            Active users
                        </p>
                    </div>
                </div>
            </section>

            <section className="border-y-2 border-zinc-900 bg-zinc-50 px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
                <div className="mb-6">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-zinc-500">
                        Top Sales
                    </p>
                    <h2 className="mt-2 text-2xl font-semibold text-zinc-900">Best Sellers</h2>
                </div>

                <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
                    {bestsellers.map((product) => (
                        <article key={product.productSlug} className="flex h-full flex-col rounded-3xl border-2 border-zinc-900 bg-white p-4 shadow-sm transition hover:-translate-y-1 hover:shadow-lg">
                            <div className="flex aspect-[4/3] items-center justify-center overflow-hidden rounded-[1.25rem] border border-zinc-200 bg-white p-3">
                                <img 
                                    src={resolveProductImage(product.productImage)}
                                    alt={product.productName}
                                    className="h-full w-full object-contain"
                                />
                            </div>
                            <h3 className="mt-4 min-h-14 text-lg font-semibold text-zinc-900">{product.productName}</h3>
                            <p className="mt-2 text-base font-bold text-zinc-900">PHP {product.productPrice}</p>
                            <p className="mt-1 text-xs font-semibold text-zinc-500 uppercase">{product.stockStatus}</p>
                            <p className="mt-3 flex-1 text-sm leading-6 text-zinc-600">
                                {product.productDescription}
                            </p>
                            <Button to={`/products/${product.productSlug}`} className="mt-5 w-full text-center" variant="primary">View Product</Button>
                        </article>
                    ))}
                </div>
            </section>
        </div>
    );
};

export default HomePage;
