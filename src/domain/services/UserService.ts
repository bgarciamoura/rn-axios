import { ApiServicePaginated } from "./ApiServicePaginated";
import { User } from "../entities/User";
import { PaginatedResponse } from "@hooks/queries/useInfiniteQuery";

export class UserService extends ApiServicePaginated<User> {
  async findByEmail(email: string): Promise<User | null> {
    const params = { email };
    const response = await this.httpClient.get<User[]>(
      `${this.basePath}/search`,
      params,
    );

    if (response.data.length === 0) {
      return null;
    }

    return response.data[0];
  }

  async updateProfile(id: string, profileData: Partial<User>): Promise<User> {
    const response = await this.httpClient.put<User>(
      `${this.basePath}/${id}/profile`,
      profileData,
    );
    return response.data;
  }

  async getPaginatedUsers(
    page: number = 1,
    limit: number = 10,
    params?: Record<string, any>,
  ): Promise<PaginatedResponse<User>> {
    return this.getPaginated(page, limit, params);
  }
}

