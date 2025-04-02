import { HttpInterceptor } from '../HttpInterceptor';

export class LogInterceptor extends HttpInterceptor {
  onRequest(config: any): any {
    console.log(`[REQUEST] ${config.method.toUpperCase()} ${config.url}`, {
      headers: config.headers,
      params: config.params,
      data: config.data,
    });
    return config;
  }

  onRequestError(error: any): any {
    console.error('[REQUEST ERROR]', error);
    return Promise.reject(error);
  }

  onResponse(response: any): any {
    console.log(`[RESPONSE] ${response.status} ${response.config.url}`, {
      data: response.data,
      headers: response.headers,
    });
    return response;
  }

  onResponseError(error: any): any {
    console.error('[RESPONSE ERROR]', error);
    return Promise.reject(error);
  }
}