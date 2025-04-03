import { Platform } from 'react-native';
import { SSLPinningConfig, SSLPinningManager, PinningMode } from './types/SSLPinningTypes';

export class DefaultSSLPinningManager implements SSLPinningManager {
	private config: SSLPinningConfig = {
		enabled: false,
		mode: PinningMode.SHA256,
		pins: [],
		rejectUnauthorized: true,
	};

	configure(config: SSLPinningConfig): void {
		this.config = {
			...this.config,
			...config,
		};
	}

	verify(hostname: string, cert: any): boolean {
		if (!this.config.enabled) {
			return true;
		}

		if (this.config.hosts && this.config.hosts.length > 0) {
			if (!this.config.hosts.some((host) => hostname === host || hostname.endsWith(`.${host}`))) {
				return true;
			}
		}

		switch (this.config.mode) {
			case PinningMode.CERTIFICATE:
				return this.verifyCertificate(cert);

			case PinningMode.PUBLIC_KEY:
				return this.verifyPublicKey(cert);

			case PinningMode.SHA256:
				return this.verifySHA256(cert);

			default:
				console.warn(`Unknown SSL pinning mode: ${this.config.mode}`);
				return false;
		}
	}

	getConfig(): SSLPinningConfig {
		return { ...this.config };
	}

	updatePins(pins: string[]): void {
		this.config.pins = [...pins];
	}

	setEnabled(enabled: boolean): void {
		this.config.enabled = enabled;
	}

	private verifyCertificate(cert: any): boolean {
		try {
			const certString = this.extractCertificateString(cert);
			return this.config.pins.some((pin) => pin === certString);
		} catch (error) {
			console.error('Certificate verification error:', error);
			return false;
		}
	}

	private verifyPublicKey(cert: any): boolean {
		try {
			const publicKey = this.extractPublicKey(cert);
			return this.config.pins.some((pin) => pin === publicKey);
		} catch (error) {
			console.error('Public key verification error:', error);
			return false;
		}
	}

	private verifySHA256(cert: any): boolean {
		try {
			const sha256Hash = this.calculateSHA256(cert);
			return this.config.pins.some((pin) => pin === sha256Hash);
		} catch (error) {
			console.error('SHA-256 verification error:', error);
			return false;
		}
	}

	private extractCertificateString(cert: any): string {
		if (Platform.OS === 'ios') {
			return cert.toString('base64');
		} else {
			return cert.toString('base64');
		}
	}

	private extractPublicKey(cert: any): string {
		if (Platform.OS === 'ios') {
			return 'extracted-public-key';
		} else {
			return 'extracted-public-key';
		}
	}

	private calculateSHA256(cert: any): string {
		return 'calculated-sha256-hash';
	}
}

