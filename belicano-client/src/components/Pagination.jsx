const PAGE_SIZE = 10;

const buttonClass = (active) =>
  `cursor-pointer whitespace-nowrap rounded-full px-4 py-2 text-xs font-bold uppercase tracking-wider ${
    active ? "bg-yellow-400 text-blue-950" : "bg-white text-zinc-700"
  }`;

const Pagination = ({ page, pageCount, onPageChange }) => {
  if (pageCount <= 1) return null;
  return (
    <nav className="mt-5 flex flex-wrap items-center justify-center gap-2">
      <button
        type="button"
        disabled={page <= 1}
        onClick={() => { onPageChange(page - 1); window.scrollTo({ top: 0, behavior: "smooth" }); }}
        className={`${buttonClass(false)} disabled:opacity-40`}
      >
        Prev
      </button>
      {Array.from({ length: pageCount }, (_, index) => index + 1).map((number) => (
        <button
          key={number}
          type="button"
          onClick={() => { onPageChange(number); window.scrollTo({ top: 0, behavior: "smooth" }); }}
          className={buttonClass(page === number)}
        >
          {number}
        </button>
      ))}
      <button
        type="button"
        disabled={page >= pageCount}
        onClick={() => { onPageChange(page + 1); window.scrollTo({ top: 0, behavior: "smooth" }); }}
        className={`${buttonClass(false)} disabled:opacity-40`}
      >
        Next
      </button>
    </nav>
  );
};

export default Pagination;
