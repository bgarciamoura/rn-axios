import { ApiServiceFactory } from '../domain/services/ApiServiceFactory';
import { UserService } from '../domain/services/UserService';
import { User } from '../domain/entities/User';
import { getToken } from '../utils/auth';
import { ContentType, PinningMode } from '../infra/http';

const API_URL = process.env.API_URL || 'https://digi-api.com/api/v1';

export const userService = (() => {
	const baseService = ApiServiceFactory.createJson<User>('', {
		baseURL: API_URL,
		getToken,
		useLogger: __DEV__,
	});

	return new UserService(baseService.httpClient, 'digimon');
})();

// Exemplo de hashes SHA256 de certificados
const SSL_CERTIFICATE_HASHES = [
	'14s5E8ICdPSCx6JQ7Yzg6VX/VU8QQmVWJxNkHgbCFZY=', // Exemplo hash 1 (Base64)
	'SK7Jng902kL1YQUSO8xndlZDxcQZ5WL/e5vGhcT6894=', // Exemplo hash 2 (Base64)
];

// Exemplo de serviço JSON com SSL Pinning
export const secureUserService = (() => {
	const baseService = ApiServiceFactory.createWithSSLPinningSHA256<User>('', {
		baseURL: API_URL,
		pins: SSL_CERTIFICATE_HASHES,
		getToken,
		useLogger: __DEV__,
	});

	return new UserService(baseService.httpClient, 'digimon');
})();

// Exemplo de serviço XML (para APIs SOAP ou outras que usam XML) com SSL Pinning
export const legacyUserService = (() => {
	const baseService = ApiServiceFactory.create<User>('users', {
		baseURL: `${API_URL}/legacy`,
		contentType: {
			requestType: ContentType.XML,
			responseType: ContentType.XML,
			xmlRootName: 'User',
		},
		sslPinning: {
			enabled: true,
			mode: PinningMode.SHA256,
			pins: SSL_CERTIFICATE_HASHES,
			hosts: ['api.myapp.com'],
		},
		getToken,
		useLogger: __DEV__,
	});

	return new UserService(baseService.httpClient, 'users');
})();

// Exemplo de serviço para upload de arquivos usando FormData com SSL Pinning
export const userMediaService = (() => {
	const baseService = ApiServiceFactory.createFormData<User>({
		baseURL: `${API_URL}/media`,
		getToken,
		useLogger: __DEV__,
		sslPinning: {
			enabled: true,
			mode: PinningMode.SHA256,
			pins: SSL_CERTIFICATE_HASHES,
		},
	});

	return new UserService(baseService.httpClient, 'users');
})();

// Exemplo de serviço com configurações personalizadas e SSL Pinning
export const customUserService = (() => {
	const baseService = ApiServiceFactory.create<User>('users', {
		baseURL: API_URL,
		getToken,
		useLogger: __DEV__,
		timeout: 60000, // 1 minuto
		contentType: {
			requestType: ContentType.JSON,
			responseType: ContentType.JSON,
		},
		httpClientType: 'fetch', // Usar implementação Fetch em vez de Axios
		sslPinning: {
			enabled: __DEV__ ? false : true, // Desabilitar em desenvolvimento
			mode: PinningMode.SHA256,
			pins: SSL_CERTIFICATE_HASHES,
		},
	});

	return new UserService(baseService.httpClient, 'users');
})();
