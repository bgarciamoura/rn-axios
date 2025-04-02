import { UseQueryOptions, UseMutationOptions, useQueryClient } from '@tanstack/react-query';
import { ApiService } from '../../domain/services/ApiService';
import { HttpError } from '../../infra/http';
import { useBaseQuery, useBaseMutation, buildQueryKey } from './useBaseQuery';

export function useResourceList<TData>(
  service: ApiService<TData>,
  params?: Record<string, any>,
  options?: UseQueryOptions<TData[], HttpError, TData[]>
) {
  const resourceName = service['basePath'];
  const queryKey = buildQueryKey(resourceName, undefined, params);

  return useBaseQuery<TData[]>(
    queryKey,
    () => service.getAll(params),
    options
  );
}

export function useResourceItem<TData>(
  service: ApiService<TData>,
  id: string | number,
  options?: UseQueryOptions<TData, HttpError, TData>
) {
  const resourceName = service['basePath'];
  const queryKey = buildQueryKey(resourceName, id);

  return useBaseQuery<TData>(
    queryKey,
    () => service.getById(id),
    options
  );
}

export function useResourceCreate<TData>(
  service: ApiService<TData>,
  options?: UseMutationOptions<TData, HttpError, Partial<TData>>
) {
  const queryClient = useQueryClient();
  const resourceName = service['basePath'];

  return useBaseMutation<TData, Partial<TData>>(
    (data) => service.create(data),
    {
      onSuccess: (data) => {
        queryClient.invalidateQueries([resourceName]);
      },
      ...options,
    }
  );
}

export function useResourceUpdate<TData>(
  service: ApiService<TData>,
  options?: UseMutationOptions<TData, HttpError, { id: string | number; data: Partial<TData> }>
) {
  const queryClient = useQueryClient();
  const resourceName = service['basePath'];

  return useBaseMutation<TData, { id: string | number; data: Partial<TData> }>(
    ({ id, data }) => service.update(id, data),
    {
      onSuccess: (data, variables) => {
        queryClient.invalidateQueries([resourceName, variables.id]);
        queryClient.invalidateQueries([resourceName]);
      },
      ...options,
    }
  );
}

export function useResourceDelete<TData>(
  service: ApiService<TData>,
  options?: UseMutationOptions<void, HttpError, string | number>
) {
  const queryClient = useQueryClient();
  const resourceName = service['basePath'];

  return useBaseMutation<void, string | number>(
    (id) => service.delete(id),
    {
      onSuccess: (_data, id) => {
        queryClient.invalidateQueries([resourceName, id]);
        queryClient.invalidateQueries([resourceName]);
      },
      ...options,
    }
  );
}
