import {
	HttpClientFactory,
	HttpConfigBuilder,
	AuthInterceptor,
	LogInterceptor,
	ContentType,
	ContentTypeOptions,
	SSLPinningConfig,
	PinningMode,
} from '../../infra/http';
import { ApiService } from './ApiService';
import { ApiServicePaginated } from './ApiServicePaginated';

export type HttpClientType = 'axios' | 'fetch';

export interface ApiServiceOptions {
	baseURL: string;
	timeout?: number;
	getToken?: () => string | null;
	useLogger?: boolean;
	contentType?: Partial<ContentTypeOptions>;
	httpClientType?: HttpClientType;
	sslPinning?: SSLPinningConfig;
}

// biome-ignore lint/complexity/noStaticOnlyClass: <explanation>
export class ApiServiceFactory {
	static create<T>(entityName: string, options: ApiServiceOptions): ApiService<T> {
		const configBuilder = new HttpConfigBuilder()
			.withBaseURL(options.baseURL)
			.withTimeout(options.timeout || 30000);

		if (options.contentType) {
			configBuilder.withContentType(options.contentType);
		}

		if (options.sslPinning) {
			configBuilder.withSSLPinning(options.sslPinning);
		}

		const interceptors = [];

		if (options.getToken) {
			interceptors.push(new AuthInterceptor(options.getToken));
		}

		if (options.useLogger) {
			interceptors.push(new LogInterceptor());
		}

		const httpClient = HttpClientFactory.create(
			options.httpClientType || 'axios',
			configBuilder.build(),
			interceptors,
		);

		return new (class extends ApiService<T> {
			constructor() {
				super(httpClient, entityName);
			}
		})();
	}

	static createPaginated<T>(
		entityName: string,
		options: ApiServiceOptions,
	): ApiServicePaginated<T> {
		const configBuilder = new HttpConfigBuilder()
			.withBaseURL(options.baseURL)
			.withTimeout(options.timeout || 30000);

		if (options.contentType) {
			configBuilder.withContentType(options.contentType);
		}

		if (options.sslPinning) {
			configBuilder.withSSLPinning(options.sslPinning);
		}

		const interceptors = [];

		if (options.getToken) {
			interceptors.push(new AuthInterceptor(options.getToken));
		}

		if (options.useLogger) {
			interceptors.push(new LogInterceptor());
		}

		const httpClient = HttpClientFactory.create(
			options.httpClientType || 'axios',
			configBuilder.build(),
			interceptors,
		);

		return new (class extends ApiServicePaginated<T> {
			constructor() {
				super(httpClient, entityName);
			}
		})();
	}

	static createJson<T>(
		entityName: string,
		options: Omit<ApiServiceOptions, 'contentType'>,
	): ApiService<T> {
		return this.create<T>(entityName, {
			...options,
			contentType: {
				requestType: ContentType.JSON,
				responseType: ContentType.JSON,
			},
		});
	}

	static createXml<T>(
		entityName: string,
		options: Omit<ApiServiceOptions, 'contentType'> & { xmlRootName?: string },
	): ApiService<T> {
		return this.create<T>(entityName, {
			...options,
			contentType: {
				requestType: ContentType.XML,
				responseType: ContentType.XML,
				xmlRootName: options.xmlRootName,
			},
		});
	}

	static createFormData<T>(
		entityName: string,
		options: Omit<ApiServiceOptions, 'contentType'>,
	): ApiService<T> {
		return this.create<T>(entityName, {
			...options,
			contentType: {
				requestType: ContentType.FORM_DATA,
				responseType: ContentType.JSON,
			},
		});
	}

	static createFormUrlencoded<T>(
		entityName: string,
		options: Omit<ApiServiceOptions, 'contentType'>,
	): ApiService<T> {
		return this.create<T>(entityName, {
			...options,
			contentType: {
				requestType: ContentType.FORM_URLENCODED,
				responseType: ContentType.JSON,
			},
		});
	}

	static createWithSSLPinning<T>(
		entityName: string,
		options: Omit<ApiServiceOptions, 'sslPinning'> & {
			pins: string[];
			mode?: PinningMode;
			hosts?: string[];
		},
	): ApiService<T> {
		return this.create<T>(entityName, {
			...options,
			sslPinning: {
				enabled: true,
				mode: options.mode || PinningMode.SHA256,
				pins: options.pins,
				hosts: options.hosts,
				rejectUnauthorized: true,
			},
		});
	}

	static createWithSSLPinningSHA256<T>(
		entityName: string,
		options: Omit<ApiServiceOptions, 'sslPinning'> & {
			pins: string[];
			hosts?: string[];
		},
	): ApiService<T> {
		return this.createWithSSLPinning<T>(entityName, {
			...options,
			mode: PinningMode.SHA256,
		});
	}

	static createWithSSLPinningCertificate<T>(
		entityName: string,
		options: Omit<ApiServiceOptions, 'sslPinning'> & {
			pins: string[];
			hosts?: string[];
		},
	): ApiService<T> {
		return this.createWithSSLPinning<T>(entityName, {
			...options,
			mode: PinningMode.CERTIFICATE,
		});
	}
}
