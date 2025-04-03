import { NativeModules } from 'react-native';

interface SSLPinningModule {
	setup(config: {
		certs: string[];
		mode: string;
		enabledDomains?: string[];
		rejectUnauthorized?: boolean;
	}): Promise<boolean>;

	isEnabled(): Promise<boolean>;

	setEnabled(enabled: boolean): Promise<void>;

	updatePins(pins: string[]): Promise<void>;
}

class NativeSSLPinning {
	private nativeModule: SSLPinningModule | null = null;

	constructor() {
		try {
			this.nativeModule = NativeModules.SSLPinning as SSLPinningModule;

			if (!this.nativeModule) {
				console.warn('Native SSL Pinning module not available');
			}
		} catch (error) {
			console.error('Error loading native SSL Pinning module:', error);
		}
	}

	isAvailable(): boolean {
		return !!this.nativeModule;
	}

	async configure(config: {
		certs: string[];
		mode: string;
		enabledDomains?: string[];
		rejectUnauthorized?: boolean;
	}): Promise<boolean> {
		if (!this.isAvailable()) {
			console.warn('Cannot configure SSL pinning: Native module not available');
			return false;
		}

		try {
			return await this.nativeModule!.setup(config);
		} catch (error) {
			console.error('Error configuring native SSL pinning:', error);
			return false;
		}
	}

	async isEnabled(): Promise<boolean> {
		if (!this.isAvailable()) {
			return false;
		}

		try {
			return await this.nativeModule!.isEnabled();
		} catch (error) {
			console.error('Error checking if SSL pinning is enabled:', error);
			return false;
		}
	}

	async setEnabled(enabled: boolean): Promise<void> {
		if (!this.isAvailable()) {
			console.warn('Cannot set SSL pinning state: Native module not available');
			return;
		}

		try {
			await this.nativeModule!.setEnabled(enabled);
		} catch (error) {
			console.error('Error setting SSL pinning state:', error);
		}
	}

	async updatePins(pins: string[]): Promise<void> {
		if (!this.isAvailable()) {
			console.warn('Cannot update SSL pins: Native module not available');
			return;
		}

		try {
			await this.nativeModule!.updatePins(pins);
		} catch (error) {
			console.error('Error updating SSL pins:', error);
		}
	}
}

export const nativeSSLPinning = new NativeSSLPinning();

