import { ApiService } from "./ApiService";
import { PaginatedResponse } from "@hooks/queries/useInfiniteQuery";

export abstract class ApiServicePaginated<T = any> extends ApiService<T> {
  async getPaginated(
    page: number = 1,
    limit: number = 10,
    params?: Record<string, any>,
  ): Promise<PaginatedResponse<T>> {
    const paginationParams = {
      page,
      limit,
      ...params,
    };

    const response = await this.httpClient.get<PaginatedResponse<T>>(
      this.basePath,
      paginationParams,
    );

    return response.data;
  }
}
