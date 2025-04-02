import {
  useInfiniteQuery,
  UseInfiniteQueryOptions,
  QueryKey,
} from '@tanstack/react-query';
import { HttpClient, HttpError, HttpResponse } from '../../infra/http';

export interface PaginatedResponse<T> {
  data: T[];
  meta: {
    currentPage: number;
    lastPage: number;
    perPage: number;
    total: number;
  };
}

export type FetchPaginatedData<T> = (
  page: number,
  limit: number,
  params?: Record<string, any>
) => Promise<PaginatedResponse<T>>;

export function useBasePaginatedQuery<TData>(
  queryKey: QueryKey,
  fetchData: FetchPaginatedData<TData>,
  params?: Record<string, any>,
  options?: UseInfiniteQueryOptions<
    PaginatedResponse<TData>,
    HttpError,
    PaginatedResponse<TData>
  >
) {
  return useInfiniteQuery<PaginatedResponse<TData>, HttpError>({
    queryKey,
    queryFn: ({ pageParam = 1 }) =>
      fetchData(pageParam, 10, params),
    getNextPageParam: (lastPage) =>
      lastPage.meta.currentPage < lastPage.meta.lastPage
        ? lastPage.meta.currentPage + 1
        : undefined,
    getPreviousPageParam: (firstPage) =>
      firstPage.meta.currentPage > 1
        ? firstPage.meta.currentPage - 1
        : undefined,
    ...options,
  });
}

export function useResourceInfiniteList<TData>(
  resourceName: string,
  fetchData: FetchPaginatedData<TData>,
  params?: Record<string, any>,
  options?: UseInfiniteQueryOptions<
    PaginatedResponse<TData>,
    HttpError,
    PaginatedResponse<TData>
  >
) {
  const queryKey = [resourceName, 'paginated', params];
  
  return useBasePaginatedQuery<TData>(
    queryKey,
    fetchData,
    params,
    options
  );
}
