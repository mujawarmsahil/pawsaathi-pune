import { useSearchParams } from 'react-router-dom';

export function usePagination(defaultSize = 10) {
  const [searchParams, setSearchParams] = useSearchParams();
  const page = Math.max(0, Number(searchParams.get('page') ?? 0));
  const size = Math.max(1, Number(searchParams.get('size') ?? defaultSize));
  function setPage(nextPage: number) {
    const next = new URLSearchParams(searchParams);
    next.set('page', String(Math.max(0, nextPage)));
    next.set('size', String(size));
    setSearchParams(next);
  }
  return { page, size, setPage };
}
