export const paginate = (items, page, pageSize = 10) => {
  const list = Array.isArray(items) ? items : [];
  const pageCount = Math.max(1, Math.ceil(list.length / pageSize));
  const current = Math.min(Math.max(1, page), pageCount);
  const start = (current - 1) * pageSize;
  return {
    items: list.slice(start, start + pageSize),
    pageCount,
    current,
    total: list.length,
  };
};