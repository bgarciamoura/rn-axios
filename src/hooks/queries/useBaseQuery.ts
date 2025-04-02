import {
  useQuery,
  useMutation,
  useQueryClient,
  UseQueryOptions,
  UseMutationOptions,
  QueryKey,
} from '@tanstack/react-query';
import { HttpClient, HttpError } from '../../infra/http';

export function useBaseQuery<TData, TError = HttpError>(
  queryKey: QueryKey,
  fetcher: () => Promise<TData>,
  options?: UseQueryOptions<TData, TError, TData>
) {
  return useQuery<TData, TError, TData>({
    queryKey,
    queryFn: fetcher,
    ...options,
  });
}

export function useBaseMutation<TData, TVariables, TError = HttpError>(
  mutationFn: (variables: TVariables) => Promise<TData>,
  options?: UseMutationOptions<TData, TError, TVariables>
) {
  const queryClient = useQueryClient();

  return useMutation<TData, TError, TVariables>({
    mutationFn,
    ...options,
  });
}

export function buildQueryKey(
  resource: string,
  id?: string | number,
  params?: Record<string, any>
): QueryKey {
  if (id) {
    return [resource, id, params];
  }
  return [resource, params];
}
