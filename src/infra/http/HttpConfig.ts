import { HttpHeaders, HttpParams } from "./types/HttpTypes";

export interface HttpConfig {
  baseURL: string;
  timeout: number;
  headers: HttpHeaders;
  params?: HttpParams;
}

export class HttpConfigBuilder {
  private config: HttpConfig = {
    baseURL: "",
    timeout: 30000,
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
    },
  };

  withBaseURL(baseURL: string): HttpConfigBuilder {
    this.config.baseURL = baseURL;
    return this;
  }

  withTimeout(timeout: number): HttpConfigBuilder {
    this.config.timeout = timeout;
    return this;
  }

  withHeaders(headers: HttpHeaders): HttpConfigBuilder {
    this.config.headers = { ...this.config.headers, ...headers };
    return this;
  }

  withParams(params: HttpParams): HttpConfigBuilder {
    this.config.params = { ...this.config.params, ...params };
    return this;
  }

  build(): HttpConfig {
    return { ...this.config };
  }
}

export const createDefaultConfig = (): HttpConfig => {
  return new HttpConfigBuilder().build();
};

