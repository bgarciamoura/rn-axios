import { UseInfiniteQueryOptions } from '@tanstack/react-query';
import { User } from '../../domain/entities/User';
import { userService } from '../../config/api';
import { HttpError } from '../../infra/http';
import { useResourceInfiniteList, PaginatedResponse } from './useInfiniteQuery';

export function useUsersPaginated(
  params?: Record<string, any>,
  options?: UseInfiniteQueryOptions<PaginatedResponse<User>, HttpError>
) {
  return useResourceInfiniteList<User>(
    'users',
    (page, limit, queryParams) => userService.getPaginatedUsers(page, limit, queryParams),
    params,
    options
  );
}
