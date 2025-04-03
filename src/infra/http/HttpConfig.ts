import { HttpHeaders, HttpParams } from './types/HttpTypes';
import { ContentType, ContentTypeOptions, defaultContentTypeOptions } from './types/ContentType';
import { SSLPinningConfig, PinningMode } from './security/types/SSLPinningTypes';

export interface HttpConfig {
	baseURL: string;
	timeout: number;
	headers: HttpHeaders;
	params?: HttpParams;
	contentTypeOptions: ContentTypeOptions;
	sslPinningConfig?: SSLPinningConfig;
}

export class HttpConfigBuilder {
	private config: HttpConfig = {
		baseURL: '',
		timeout: 30000,
		headers: {
			'Content-Type': ContentType.JSON,
			Accept: ContentType.JSON,
		},
		contentTypeOptions: { ...defaultContentTypeOptions },
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

	withContentType(options: Partial<ContentTypeOptions>): HttpConfigBuilder {
		this.config.contentTypeOptions = {
			...this.config.contentTypeOptions,
			...options,
		};

		// Atualiza os headers com base nos tipos de conteúdo
		this.config.headers = {
			...this.config.headers,
			'Content-Type': options.requestType || this.config.contentTypeOptions.requestType,
			Accept: options.responseType || this.config.contentTypeOptions.responseType,
		};

		return this;
	}

	withJsonContent(): HttpConfigBuilder {
		return this.withContentType({
			requestType: ContentType.JSON,
			responseType: ContentType.JSON,
		});
	}

	withXmlContent(xmlRootName: string = 'root'): HttpConfigBuilder {
		return this.withContentType({
			requestType: ContentType.XML,
			responseType: ContentType.XML,
			xmlRootName,
		});
	}

	withFormDataContent(): HttpConfigBuilder {
		return this.withContentType({
			requestType: ContentType.FORM_DATA,
			responseType: ContentType.JSON,
		});
	}

	withFormUrlencodedContent(): HttpConfigBuilder {
		return this.withContentType({
			requestType: ContentType.FORM_URLENCODED,
			responseType: ContentType.JSON,
		});
	}

	withSSLPinning(config: SSLPinningConfig): HttpConfigBuilder {
		this.config.sslPinningConfig = config;
		return this;
	}

	/**
	 * Configure SSL Pinning with SHA-256 hashes
	 */
	withSSLPinningSHA256(pins: string[], hosts?: string[]): HttpConfigBuilder {
		this.config.sslPinningConfig = {
			enabled: true,
			mode: PinningMode.SHA256,
			pins,
			hosts,
			rejectUnauthorized: true,
		};
		return this;
	}

	/**
	 * Configure SSL Pinning with certificates
	 */
	withSSLPinningCertificate(pins: string[], hosts?: string[]): HttpConfigBuilder {
		this.config.sslPinningConfig = {
			enabled: true,
			mode: PinningMode.CERTIFICATE,
			pins,
			hosts,
			rejectUnauthorized: true,
		};
		return this;
	}

	/**
	 * Configure SSL Pinning with public keys
	 */
	withSSLPinningPublicKey(pins: string[], hosts?: string[]): HttpConfigBuilder {
		this.config.sslPinningConfig = {
			enabled: true,
			mode: PinningMode.PUBLIC_KEY,
			pins,
			hosts,
			rejectUnauthorized: true,
		};
		return this;
	}

	build(): HttpConfig {
		return { ...this.config };
	}
}

export const createDefaultConfig = (): HttpConfig => {
	return new HttpConfigBuilder().build();
};
