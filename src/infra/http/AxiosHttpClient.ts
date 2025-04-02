import axios, {
  type AxiosInstance,
  type AxiosResponse,
  type AxiosError,
} from "axios";
import type { HttpClient } from "./interfaces/HttpClient";
import type {
  HttpRequest,
  HttpResponse,
  HttpHeaders,
  HttpParams,
} from "./types/HttpTypes";
import type { HttpConfig } from "./HttpConfig";
import {
  HttpError,
  NetworkError,
  TimeoutError,
  UnauthorizedError,
  ForbiddenError,
  NotFoundError,
  ServerError,
} from "./HttpError";
import type { HttpInterceptor } from "./interfaces/HttpInterceptor";

export class AxiosHttpClient implements HttpClient {
  private readonly axios: AxiosInstance;

  constructor(
    config: HttpConfig,
    private readonly interceptors: HttpInterceptor[] = [],
  ) {
    this.axios = axios.create({
      baseURL: config.baseURL,
      timeout: config.timeout,
      headers: config.headers,
      params: config.params,
    });

    this.setupInterceptors();
  }

  private setupInterceptors(): void {
    this.axios.interceptors.request.use(
      (config) => {
        return this.interceptors.reduce(
          (acc, interceptor) => interceptor.onRequest(acc),
          config,
        );
      },
      (error) => {
        return this.interceptors.reduce(
          (acc, interceptor) => interceptor.onRequestError(acc),
          error,
        );
      },
    );

    this.axios.interceptors.response.use(
      (response) => {
        return this.interceptors.reduce(
          (acc, interceptor) => interceptor.onResponse(acc),
          response,
        );
      },
      (error: AxiosError) => {
        const processedError = this.interceptors.reduce(
          (acc, interceptor) => interceptor.onResponseError(acc),
          error,
        );

        if (!processedError.response) {
          if (processedError.code === "ECONNABORTED") {
            throw new TimeoutError();
          }
          throw new NetworkError();
        }

        const status = processedError.response.status;
        const data = processedError.response.data;

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

        throw new HttpError(
          data?.message || processedError.message,
          status,
          data,
        );
      },
    );
  }

  async request<T = any>(request: HttpRequest): Promise<HttpResponse<T>> {
    try {
      const response: AxiosResponse<T> = await this.axios.request({
        url: request.url,
        method: request.method,
        headers: request.headers,
        params: request.params,
        data: request.data,
        timeout: request.timeout,
      });

      return {
        data: response.data,
        status: response.status,
        headers: response.headers as HttpHeaders,
      };
    } catch (error) {
      if (error instanceof HttpError) {
        throw error;
      }
      throw new HttpError("Unknown error occurred", 0);
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
