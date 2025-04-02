import { HttpClient } from "./interfaces/HttpClient";
import { AxiosHttpClient } from "./AxiosHttpClient";
import { FetchHttpClient } from "./adapters/FetchHttpClient";
import { HttpConfig, createDefaultConfig } from "./HttpConfig";
import { HttpInterceptor } from "./interfaces/HttpInterceptor";

type HttpClientType = "axios" | "fetch";

// biome-ignore lint/complexity/noStaticOnlyClass: <explanation>
export class HttpClientFactory {
  static create(
    type: HttpClientType = "axios",
    config: HttpConfig = createDefaultConfig(),
    interceptors: HttpInterceptor[] = [],
  ): HttpClient {
    switch (type) {
      case "axios":
        return new AxiosHttpClient(config, interceptors);
      case "fetch":
        return new FetchHttpClient(config);
      default:
        throw new Error(`HTTP client type ${type} not supported`);
    }
  }
}
