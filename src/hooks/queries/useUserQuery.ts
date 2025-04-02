import { UseQueryOptions, UseMutationOptions, useQueryClient } from '@tanstack/react-query';
import { User } from '../../domain/entities/User';
import { userService } from '../../config/api';
import { HttpError } from '../../infra/http';
import { useBaseQuery, useBaseMutation, buildQueryKey } from './useBaseQuery';
import {
  useResourceList,
  useResourceItem,
  useResourceCreate,
  useResourceUpdate,
  useResourceDelete,
} from './useResourceQuery';

export function useUsers(
  params?: Record<string, any>,
  options?: UseQueryOptions<User[], HttpError, User[]>
) {
  return useResourceList<User>(userService, params, options);
}

export function useUser(
  id: string,
  options?: UseQueryOptions<User, HttpError, User>
) {
  return useResourceItem<User>(userService, id, options);
}

export function useUserByEmail(
  email: string,
  options?: UseQueryOptions<User | null, HttpError, User | null>
) {
  const queryKey = buildQueryKey('users', 'byEmail', { email });

  return useBaseQuery<User | null>(
    queryKey,
    () => userService.findByEmail(email),
    options
  );
}

export function useCreateUser(
  options?: UseMutationOptions<User, HttpError, Partial<User>>
) {
  return useResourceCreate<User>(userService, options);
}

export function useUpdateUser(
  options?: UseMutationOptions<User, HttpError, { id: string; data: Partial<User> }>
) {
  return useResourceUpdate<User>(userService, options);
}

export function useUpdateUserProfile(
  options?: UseMutationOptions<User, HttpError, { id: string; data: Partial<User> }>
) {
  const queryClient = useQueryClient();

  return useBaseMutation<User, { id: string; data: Partial<User> }>(
    ({ id, data }) => userService.updateProfile(id, data),
    {
      onSuccess: (data, variables) => {
        queryClient.invalidateQueries(['users', variables.id]);
        queryClient.invalidateQueries(['users']);
      },
      ...options,
    }
  );
}

export function useDeleteUser(
  options?: UseMutationOptions<void, HttpError, string>
) {
  return useResourceDelete<User>(userService, options);
}
