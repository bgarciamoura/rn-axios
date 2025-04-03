import { HttpClient } from '../interfaces/HttpClient';
import { HttpRequest, HttpResponse, HttpHeaders, HttpParams } from '../types/HttpTypes';
import { HttpConfig } from '../HttpConfig';
import {
	HttpError,
	NetworkError,
	TimeoutError,
	UnauthorizedError,
	ForbiddenError,
	NotFoundError,
	ServerError,
} from '../HttpError';
import { ContentType } from '../types/ContentType';
import { getSerializer } from '../serializers/Serializer';
import { FetchSSLPinningAdapter } from '../security/FetchSSLPinningAdapter';

export class FetchHttpClient implements HttpClient {
	private readonly sslPinningAdapter: FetchSSLPinningAdapter | null = null;
	private readonly fetchWithPinning: typeof fetch;

	constructor(private readonly config: HttpConfig) {
		// Configure SSL pinning if specified
		if (config.sslPinningConfig?.enabled) {
			this.sslPinningAdapter = new FetchSSLPinningAdapter();
			this.setupSSLPinning();
			this.fetchWithPinning = this.sslPinningAdapter.createFetchWithPinning();
		} else {
			this.fetchWithPinning = fetch;
		}
	}

	private async setupSSLPinning(): Promise<void> {
		if (this.sslPinningAdapter && this.config.sslPinningConfig) {
			await this.sslPinningAdapter.configure(this.config.sslPinningConfig);
		}
	}

	private async parseResponse<T>(response: Response): Promise<T> {
		const contentType =
			response.headers.get('content-type') || this.config.contentTypeOptions.responseType;

		const parsers: { [key: string]: () => Promise<any> } = {
			[ContentType.JSON]: () => response.json(),
			[ContentType.XML]: async () => {
				const text = await response.text();
				const serializer = getSerializer(
					ContentType.XML,
					this.config.contentTypeOptions.xmlRootName,
				);
				return serializer.deserialize(text);
			},
			'text/': () => response.text(),
		};

		for (const [key, parser] of Object.entries(parsers)) {
			if (contentType.includes(key)) {
				return parser();
			}
		}

		// Para outros tipos, como binário
		return response.blob() as unknown as T;
	}

	private async handleResponse<T>(response: Response): Promise<HttpResponse<T>> {
		if (!response.ok) {
			const status = response.status;
			let errorData;

			try {
				errorData = await this.parseResponse(response);
			} catch (e) {
				errorData = { message: response.statusText };
			}

			if (status === 401) {
				throw new UnauthorizedError(errorData?.message, errorData);
			}
			if (status === 403) {
				throw new ForbiddenError(errorData?.message, errorData);
			}
			if (status === 404) {
				throw new NotFoundError(errorData?.message, errorData);
			}
			if (status >= 500) {
				throw new ServerError(errorData?.message, errorData);
			}

			throw new HttpError(errorData?.message || 'Request failed', status, errorData);
		}

		const data = await this.parseResponse<T>(response);

		const headers: HttpHeaders = {};
		response.headers.forEach((value, key) => {
			headers[key] = value;
		});

		return {
			data,
			status: response.status,
			headers,
		};
	}

	private getFullUrl(url: string, params?: HttpParams): string {
		const baseURL = this.config.baseURL.endsWith('/')
			? this.config.baseURL.slice(0, -1)
			: this.config.baseURL;

		const endpoint = url.startsWith('/') ? url : `/${url}`;
		const fullUrl = new URL(`${baseURL}${endpoint}`);

		if (params) {
			Object.entries(params).forEach(([key, value]) => {
				fullUrl.searchParams.append(key, String(value));
			});
		}

		return fullUrl.toString();
	}

	async request<T = any>(request: HttpRequest): Promise<HttpResponse<T>> {
		const { url, method, headers = {}, params, data, timeout = this.config.timeout } = request;

		const controller = new AbortController();
		const timeoutId = setTimeout(() => controller.abort(), timeout);

		try {
			const requestHeaders = { ...this.config.headers, ...headers };
			let body: any = undefined;

			if (data) {
				const contentType =
					requestHeaders['Content-Type'] || this.config.contentTypeOptions.requestType;
				const serializer = getSerializer(
					contentType as ContentType,
					this.config.contentTypeOptions.xmlRootName,
				);

				body = serializer.serialize(data);

				// Se for FormData, o navegador define automaticamente o Content-Type com boundary
				if (contentType === ContentType.FORM_DATA && body instanceof FormData) {
					delete requestHeaders['Content-Type'];
				}
			}

			// Use fetchWithPinning which may be patched with SSL pinning
			const response = await this.fetchWithPinning(this.getFullUrl(url, params), {
				method: method.toUpperCase(),
				headers: requestHeaders,
				body,
				signal: controller.signal,
			});

			clearTimeout(timeoutId);
			return this.handleResponse<T>(response);
		} catch (error) {
			clearTimeout(timeoutId);

			if (error.name === 'AbortError') {
				throw new TimeoutError();
			}

			throw new NetworkError();
		}
	}

	async get<T = any>(
		url: string,
		params?: HttpParams,
		headers?: HttpHeaders,
	): Promise<HttpResponse<T>> {
		return this.request<T>({
			url,
			method: 'get',
			params,
			headers,
		});
	}

	async post<T = any>(url: string, data?: any, headers?: HttpHeaders): Promise<HttpResponse<T>> {
		return this.request<T>({
			url,
			method: 'post',
			data,
			headers,
		});
	}

	async put<T = any>(url: string, data?: any, headers?: HttpHeaders): Promise<HttpResponse<T>> {
		return this.request<T>({
			url,
			method: 'put',
			data,
			headers,
		});
	}

	async delete<T = any>(url: string, headers?: HttpHeaders): Promise<HttpResponse<T>> {
		return this.request<T>({
			url,
			method: 'delete',
			headers,
		});
	}

	async patch<T = any>(url: string, data?: any, headers?: HttpHeaders): Promise<HttpResponse<T>> {
		return this.request<T>({
			url,
			method: 'patch',
			data,
			headers,
		});
	}
}
