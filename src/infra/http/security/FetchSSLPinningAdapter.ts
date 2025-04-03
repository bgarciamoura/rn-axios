import { Platform } from 'react-native';
import { SSLPinningConfig } from './types/SSLPinningTypes';
import { nativeSSLPinning } from './NativeSSLPinning';

export class FetchSSLPinningAdapter {
	private config: SSLPinningConfig | null = null;

	async configure(config: SSLPinningConfig): Promise<void> {
		this.config = config;

		if (!config.enabled) {
			return;
		}

		if (Platform.OS === 'ios' || Platform.OS === 'android') {
			await this.configureNativePinning(config);
		} else {
			console.warn('SSL pinning for Fetch API on web platforms is limited');
		}
	}

	applyToFetchOptions(url: string, options: RequestInit = {}): RequestInit {
		if (!this.config || !this.config.enabled) {
			return options;
		}

		if (Platform.OS !== 'ios' && Platform.OS !== 'android') {
			console.warn('SSL pinning for Fetch API on web is not fully supported');
		}

		return options;
	}

	createFetchWithPinning(): typeof fetch {
		const originalFetch = fetch;
		const adapter = this;

		return function patchedFetch(input: RequestInfo, init?: RequestInit): Promise<Response> {
			const url = typeof input === 'string' ? input : input.url;
			const options =
				typeof input === 'string'
					? init || {}
					: {
							...init,
							method: input.method,
							headers: input.headers,
							body: input.body,
							mode: input.mode,
							credentials: input.credentials,
							cache: input.cache,
							redirect: input.redirect,
							referrer: input.referrer,
							integrity: input.integrity,
						};

			const modifiedOptions = adapter.applyToFetchOptions(url, options);

			return originalFetch(input, modifiedOptions);
		};
	}

	private async configureNativePinning(config: SSLPinningConfig): Promise<void> {
		if (!nativeSSLPinning.isAvailable()) {
			console.warn('Native SSL pinning module not available');
			return;
		}

		try {
			await nativeSSLPinning.configure({
				certs: config.pins,
				mode: config.mode,
				enabledDomains: config.hosts,
				rejectUnauthorized: config.rejectUnauthorized,
			});

			await nativeSSLPinning.setEnabled(true);
		} catch (error) {
			console.error('Error configuring native SSL pinning:', error);
		}
	}
}

