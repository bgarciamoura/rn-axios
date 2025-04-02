import { HttpClient } from "./interfaces/HttpClient";
import {
  HttpRequest,
  HttpResponse,
  HttpHeaders,
  HttpParams,
} from "./types/HttpTypes";
import { HttpConfig } from "./HttpConfig";
import {
  HttpError,
  NetworkError,
  TimeoutError,
  UnauthorizedError,
  ForbiddenError,
  NotFoundError,
  ServerError,
} from "./HttpError";

export class FetchHttpClient implements HttpClient {
  constructor(private readonly config: HttpConfig) {}

  private async handleResponse<T>(
    response: Response,
  ): Promise<HttpResponse<T>> {
    const data = await response.json();

    if (!response.ok) {
      const status = response.status;

      if (status === 401) {
        throw new UnauthorizedError(data?.message, data);
      }
      if (status === 403) {
        throw new ForbiddenError(data?.message, data);
      }
      if (status === 404) {
        throw new NotFoundError(data?.message, data);
      }
      if (status >= 500) {
        throw new ServerError(data?.message, data);
      }

      throw new HttpError(data?.message || "Request failed", status, data);
    }

    const headers: HttpHeaders = {};
    response.headers.forEach((value, key) => {
      headers[key] = value;
    });

    return {
      data,
      status: response.status,
      headers,
    };
  }

  private getFullUrl(url: string, params?: HttpParams): string {
    const baseURL = this.config.baseURL.endsWith("/")
      ? this.config.baseURL.slice(0, -1)
      : this.config.baseURL;

    const endpoint = url.startsWith("/") ? url : `/${url}`;
    const fullUrl = new URL(`${baseURL}${endpoint}`);

    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        fullUrl.searchParams.append(key, String(value));
      });
    }

    return fullUrl.toString();
  }

  async request<T = any>(request: HttpRequest): Promise<HttpResponse<T>> {
    const {
      url,
      method,
      headers = {},
      params,
      data,
      timeout = this.config.timeout,
    } = request;

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);

    try {
      const response = await fetch(this.getFullUrl(url, params), {
        method: method.toUpperCase(),
        headers: {
          ...this.config.headers,
          ...headers,
        },
        body: data ? JSON.stringify(data) : undefined,
        signal: controller.signal,
      });

      clearTimeout(timeoutId);
      return this.handleResponse<T>(response);
    } catch (error) {
      clearTimeout(timeoutId);

      if (error.name === "AbortError") {
        throw new TimeoutError();
      }

      throw new NetworkError();
    }
  }

  async get<T = any>(
    url: string,
    params?: HttpParams,
    headers?: HttpHeaders,
  ): Promise<HttpResponse<T>> {
    return this.request<T>({
      url,
      method: "get",
      params,
      headers,
    });
  }

  async post<T = any>(
    url: string,
    data?: any,
    headers?: HttpHeaders,
  ): Promise<HttpResponse<T>> {
    return this.request<T>({
      url,
      method: "post",
      data,
      headers,
    });
  }

  async put<T = any>(
    url: string,
    data?: any,
    headers?: HttpHeaders,
  ): Promise<HttpResponse<T>> {
    return this.request<T>({
      url,
      method: "put",
      data,
      headers,
    });
  }

  async delete<T = any>(
    url: string,
    headers?: HttpHeaders,
  ): Promise<HttpResponse<T>> {
    return this.request<T>({
      url,
      method: "delete",
      headers,
    });
  }

  async patch<T = any>(
    url: string,
    data?: any,
    headers?: HttpHeaders,
  ): Promise<HttpResponse<T>> {
    return this.request<T>({
      url,
      method: "patch",
      data,
      headers,
    });
  }
}

