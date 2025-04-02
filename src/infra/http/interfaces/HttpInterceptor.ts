export interface RequestInterceptor {
  onRequest(config: any): any;
  onRequestError(error: any): any;
}

export interface ResponseInterceptor {
  onResponse(response: any): any;
  onResponseError(error: any): any;
}

export abstract class HttpInterceptor implements RequestInterceptor, ResponseInterceptor {
  abstract onRequest(config: any): any;
  abstract onRequestError(error: any): any;
  abstract onResponse(response: any): any;
  abstract onResponseError(error: any): any;
}