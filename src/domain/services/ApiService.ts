import { HttpClient } from "../../infra/http";

export abstract class ApiService<T = any> {
  constructor(
    protected readonly httpClient: HttpClient,
    protected readonly basePath: string,
  ) {}

  async getAll(params?: Record<string, any>): Promise<T[]> {
    const response = await this.httpClient.get<T[]>(this.basePath, params);
    return response.data;
  }

  async getById(id: string | number): Promise<T> {
    const response = await this.httpClient.get<T>(`${this.basePath}/${id}`);
    return response.data;
  }

  async create(data: Partial<T>): Promise<T> {
    const response = await this.httpClient.post<T>(this.basePath, data);
    return response.data;
  }

  async update(id: string | number, data: Partial<T>): Promise<T> {
    const response = await this.httpClient.put<T>(
      `${this.basePath}/${id}`,
      data,
    );
    return response.data;
  }

  async delete(id: string | number): Promise<void> {
    await this.httpClient.delete(`${this.basePath}/${id}`);
  }
}
