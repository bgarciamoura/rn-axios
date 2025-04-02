import { ApiService } from "./ApiService";
import { User } from "../entities/User";

export class UserService extends ApiService<User> {
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
}

