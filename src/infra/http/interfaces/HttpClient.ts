import type {
  HttpRequest,
  HttpResponse,
  HttpHeaders,
  HttpParams,
} from "./HttpTypes";

export interface HttpClient {
  request<T = any>(request: HttpRequest): Promise<HttpResponse<T>>;
  get<T = any>(
    url: string,
    params?: HttpParams,
    headers?: HttpHeaders,
  ): Promise<HttpResponse<T>>;
  post<T = any>(
    url: string,
    data?: any,
    headers?: HttpHeaders,
  ): Promise<HttpResponse<T>>;
  put<T = any>(
    url: string,
    data?: any,
    headers?: HttpHeaders,
  ): Promise<HttpResponse<T>>;
  delete<T = any>(url: string, headers?: HttpHeaders): Promise<HttpResponse<T>>;
  patch<T = any>(
    url: string,
    data?: any,
    headers?: HttpHeaders,
  ): Promise<HttpResponse<T>>;
}
