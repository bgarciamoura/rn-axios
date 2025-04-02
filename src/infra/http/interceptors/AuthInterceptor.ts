import { HttpInterceptor } from '../HttpInterceptor';

export class AuthInterceptor extends HttpInterceptor {
  constructor(private readonly getToken: () => string | null) {
    super();
  }

  onRequest(config: any): any {
    const token = this.getToken();
    if (token) {
      config.headers = {
        ...config.headers,
        Authorization: `Bearer ${token}`,
      };
    }
    return config;
  }

  onRequestError(error: any): any {
    return Promise.reject(error);
  }

  onResponse(response: any): any {
    return response;
  }

  onResponseError(error: any): any {
    return Promise.reject(error);
  }
}