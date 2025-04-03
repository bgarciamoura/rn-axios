import axios, { AxiosInstance, AxiosResponse, AxiosError, AxiosRequestConfig } from 'axios';
import { HttpClient } from './interfaces/HttpClient';
import { HttpRequest, HttpResponse, HttpHeaders, HttpParams } from './types/HttpTypes';
import { HttpConfig } from './HttpConfig';
import {
	HttpError,
	NetworkError,
	TimeoutError,
	UnauthorizedError,
	ForbiddenError,
	NotFoundError,
	ServerError,
} from './HttpError';
import { HttpInterceptor } from './interfaces/HttpInterceptor';
import { ContentType } from './types/ContentType';
import { getSerializer } from './serializers/Serializer';
import { AxiosSSLPinningAdapter } from './security/AxiosSSLPinningAdapter';

export class AxiosHttpClient implements HttpClient {
	private readonly axios: AxiosInstance;
	private readonly sslPinningAdapter: AxiosSSLPinningAdapter | null = null;

	constructor(
		private readonly config: HttpConfig,
		private readonly interceptors: HttpInterceptor[] = [],
	) {
		this.axios = axios.create({
			baseURL: config.baseURL,
			timeout: config.timeout,
			headers: config.headers,
			params: config.params,
		});

		// Configure SSL pinning if specified
		if (config.sslPinningConfig?.enabled) {
			this.sslPinningAdapter = new AxiosSSLPinningAdapter();
			this.setupSSLPinning();
		}

		this.setupInterceptors();
	}

	private async setupSSLPinning(): Promise<void> {
		if (this.sslPinningAdapter && this.config.sslPinningConfig) {
			await this.sslPinningAdapter.configure(this.config.sslPinningConfig);
		}
	}

	private setupInterceptors(): void {
		// Add SSL pinning interceptor first if available
		if (this.sslPinningAdapter) {
			this.axios.interceptors.request.use((config) => {
				return this.sslPinningAdapter!.applyToAxiosConfig(config);
			});
		}

		this.axios.interceptors.request.use(
			(config) => {
				return this.interceptors.reduce((acc, interceptor) => interceptor.onRequest(acc), config);
			},
			(error) => {
				return this.interceptors.reduce(
					(acc, interceptor) => interceptor.onRequestError(acc),
					error,
				);
			},
		);

		this.axios.interceptors.response.use(
			(response) => {
				return this.interceptors.reduce(
					(acc, interceptor) => interceptor.onResponse(acc),
					response,
				);
			},
			(error: AxiosError) => {
				const processedError = this.interceptors.reduce(
					(acc, interceptor) => interceptor.onResponseError(acc),
					error,
				);

				if (!processedError.response) {
					if (processedError.code === 'ECONNABORTED') {
						throw new TimeoutError();
					}
					throw new NetworkError();
				}

				const status = processedError.response.status;
				const data = processedError.response.data;

				if (status === 401) {
					throw new UnauthorizedError(data?.message, data);
				}
				if (status === 403) {
					throw new ForbiddenError(data?.message, data);
				}
				if (status === 404) {
					throw new NotFoundError(data?.message, data);
				}
				if (status >= 500) {
					throw new ServerError(data?.message, data);
				}

				throw new HttpError(data?.message || processedError.message, status, data);
			},
		);
	}

	async request<T = any>(request: HttpRequest): Promise<HttpResponse<T>> {
		try {
			// Preparar a configuração da requisição
			const axiosConfig: AxiosRequestConfig = {
				url: request.url,
				method: request.method,
				headers: request.headers || {},
				params: request.params,
				timeout: request.timeout,
			};

			// Processa o corpo da requisição com base no tipo de conteúdo
			if (request.data) {
				const contentType =
					request.headers?.['Content-Type'] || this.config.headers['Content-Type'];
				const serializer = getSerializer(
					contentType as ContentType,
					this.config.contentTypeOptions.xmlRootName,
				);

				axiosConfig.data = serializer.serialize(request.data);

				// Se for multipart/form-data, o Axios define o Content-Type automaticamente com boundary
				if (contentType !== ContentType.FORM_DATA) {
					axiosConfig.headers['Content-Type'] = contentType;
				}
			}

			const response: AxiosResponse<T> = await this.axios.request(axiosConfig);

			// Processa a resposta com base no tipo de conteúdo de resposta
			let processedData = response.data;
			const responseContentType =
				response.headers['content-type'] || this.config.contentTypeOptions.responseType;

			if (typeof responseContentType === 'string') {
				// Extrai o content-type básico sem parâmetros extras (como charset)
				const baseContentType = responseContentType.split(';')[0].trim();

				if (baseContentType === ContentType.XML) {
					const serializer = getSerializer(
						ContentType.XML,
						this.config.contentTypeOptions.xmlRootName,
					);
					processedData = serializer.deserialize(response.data);
				}
			}

			return {
				data: processedData,
				status: response.status,
				headers: response.headers as HttpHeaders,
			};
		} catch (error) {
			if (error instanceof HttpError) {
				throw error;
			}
			throw new HttpError('Unknown error occurred', 0);
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
