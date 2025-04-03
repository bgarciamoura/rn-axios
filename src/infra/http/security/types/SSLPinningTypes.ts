export enum PinningMode {
	CERTIFICATE = 'certificate',
	PUBLIC_KEY = 'publicKey',
	SHA256 = 'sha256',
}

export interface SSLPinningConfig {
	enabled: boolean;
	mode: PinningMode;
	pins: string[];
	rejectUnauthorized?: boolean;
	trustedCAs?: string[];
	hosts?: string[];
}

export interface SSLPinningManager {
	configure(config: SSLPinningConfig): void;
	verify(hostname: string, cert: any): boolean;
	getConfig(): SSLPinningConfig;
	updatePins(pins: string[]): void;
	setEnabled(enabled: boolean): void;
}
