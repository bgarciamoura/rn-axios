import { AxiosRequestConfig } from 'axios';
import { Platform } from 'react-native';
import { SSLPinningConfig } from './types/SSLPinningTypes';
import { nativeSSLPinning } from './NativeSSLPinning';

export class AxiosSSLPinningAdapter {
	private config: SSLPinningConfig | null = null;

	async configure(config: SSLPinningConfig): Promise<void> {
		this.config = config;

		if (!config.enabled) {
			return;
		}

		if (Platform.OS === 'ios' || Platform.OS === 'android') {
			await this.configureNativePinning(config);
		} else {
			this.configureWebPinning(config);
		}
	}

	applyToAxiosConfig(axiosConfig: AxiosRequestConfig): AxiosRequestConfig {
		if (!this.config || !this.config.enabled) {
			return axiosConfig;
		}

		if (Platform.OS !== 'ios' && Platform.OS !== 'android') {
			return this.applyWebPinning(axiosConfig);
		}

		return axiosConfig;
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

	private configureWebPinning(config: SSLPinningConfig): void {
		console.warn('SSL pinning for web platforms is limited');
	}

	private applyWebPinning(axiosConfig: AxiosRequestConfig): AxiosRequestConfig {
		return axiosConfig;
	}
}

