import {
  HttpClientFactory,
  HttpConfigBuilder,
  AuthInterceptor,
  LogInterceptor,
} from "../../infra/http";
import { ApiService } from "./ApiService";

export class ApiServiceFactory {
  create<T>(
    entityName: string,
    baseURL: string,
    getToken?: () => string | null,
    useLogger = false,
  ): ApiService<T> {
    const configBuilder = new HttpConfigBuilder()
      .withBaseURL(baseURL)
      .withTimeout(30000);

    const interceptors = [];

    if (getToken) {
      interceptors.push(new AuthInterceptor(getToken));
    }

    if (useLogger) {
      interceptors.push(new LogInterceptor());
    }

    const httpClient = HttpClientFactory.create(
      "axios",
      configBuilder.build(),
      interceptors,
    );

    return new (class extends ApiService<T> {
      constructor() {
        super(httpClient, entityName);
      }
    })();
  }
}
