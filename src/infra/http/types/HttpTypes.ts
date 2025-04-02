export type HttpMethod = "get" | "post" | "put" | "delete" | "patch";

export type HttpHeaders = Record<string, string>;

export type HttpParams = Record<string, string | number | boolean>;

export interface HttpRequest {
  url: string;
  method: HttpMethod;
  headers?: HttpHeaders;
  params?: HttpParams;
  data?: any;
  timeout?: number;
}

export interface HttpResponse<T = any> {
  data: T;
  status: number;
  headers: HttpHeaders;
}
