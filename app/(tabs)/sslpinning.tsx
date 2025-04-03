import React, { useState } from 'react';
import { View, Text, Button, StyleSheet, Alert, Platform } from 'react-native';
import { userService, secureUserService } from '@config/api';
import { ApiServiceFactory } from '../../src/domain/services/ApiServiceFactory';
import { User } from '../../src/domain/entities/User';
import { PinningMode } from '../../src/infra/http';
import { nativeSSLPinning } from '../../src/infra/http/security/NativeSSLPinning';

// Exemplo de hashes SHA256 de certificados para fins de demonstração
const SSL_CERTIFICATE_HASHES = [
	'14s5E8ICdPSCx6JQ7Yzg6VX/VU8QQmVWJxNkHgbCFZY=',
	'SK7Jng902kL1YQUSO8xndlZDxcQZ5WL/e5vGhcT6894=',
];

const SSLPinningExample: React.FC = () => {
	const [result, setResult] = useState<string>('');
	const [loading, setLoading] = useState<boolean>(false);

	// Função para gerar um hash SHA-256 de um certificado (mock)
	const generateCertificateHash = async (domain: string): Promise<string> => {
		// Em uma implementação real, você obteria o certificado do servidor
		// e calcularia o hash SHA-256. Aqui estamos apenas simulando.
		return 'SK7Jng902kL1YQUSO8xndlZDxcQZ5WL/e5vGhcT6894=';
	};

	// Request padrão sem SSL Pinning
	const handleStandardRequest = async () => {
		setLoading(true);
		try {
			const users = await userService.getAll();
			setResult(`Requisição padrão: Sucesso! ${users.length} usuários recuperados.`);
		} catch (error) {
			setResult(`Requisição padrão: Erro! ${error.message}`);
		} finally {
			setLoading(false);
		}
	};

	// Request com SSL Pinning
	const handleSecureRequest = async () => {
		setLoading(true);
		try {
			const users = await secureUserService.getAll();
			setResult(`Requisição segura: Sucesso! ${users.length} usuários recuperados.`);
		} catch (error) {
			setResult(`Requisição segura: Erro! ${error.message}`);
		} finally {
			setLoading(false);
		}
	};

	// Criar um serviço dinâmico com SSL Pinning
	const handleDynamicPinning = async () => {
		setLoading(true);
		try {
			// Criar serviço dinamicamente com SSL Pinning
			const dynamicService = ApiServiceFactory.createWithSSLPinning<User>('users', {
				baseURL: 'https://api.myapp.com',
				pins: SSL_CERTIFICATE_HASHES,
				mode: PinningMode.SHA256,
				hosts: ['api.myapp.com'],
			});

			// Fazer requisição usando o serviço
			const users = await dynamicService.getAll();
			setResult(`Pinning dinâmico: Sucesso! ${users.length} usuários recuperados.`);
		} catch (error) {
			setResult(`Pinning dinâmico: Erro! ${error.message}`);
		} finally {
			setLoading(false);
		}
	};

	// Atualizar certificados pinados
	const handleUpdatePins = async () => {
		setLoading(true);
		try {
			// Obter novo hash de certificado (em uma implementação real)
			const newHash = await generateCertificateHash('api.myapp.com');

			// Atualizar pins
			if (nativeSSLPinning.isAvailable()) {
				await nativeSSLPinning.updatePins([...SSL_CERTIFICATE_HASHES, newHash]);
				setResult(`Pins atualizados: Adicionado novo certificado!`);
			} else {
				setResult(`Erro: Módulo nativo de SSL Pinning não disponível`);
			}
		} catch (error) {
			setResult(`Atualizar pins: Erro! ${error.message}`);
		} finally {
			setLoading(false);
		}
	};

	// Verificar se o módulo nativo está disponível
	const checkNativeModule = () => {
		const isAvailable = nativeSSLPinning.isAvailable();
		setResult(`Módulo nativo: ${isAvailable ? 'Disponível' : 'Não disponível'}`);

		if (!isAvailable) {
			Alert.alert(
				'Módulo nativo não disponível',
				'O módulo nativo de SSL Pinning não está disponível. Certifique-se de ' +
					'que os módulos nativos foram configurados corretamente.',
			);
		}
	};

	// Mostrar informações sobre plataforma
	const showPlatformInfo = () => {
		setResult(
			`Plataforma: ${Platform.OS}\nVersão: ${Platform.Version}\n` +
				`Módulo nativo: ${nativeSSLPinning.isAvailable() ? 'Disponível' : 'Não disponível'}`,
		);
	};

	return (
		<View style={styles.container}>
			<Text style={styles.title}>SSL Pinning Demo</Text>

			<View style={styles.infoContainer}>
				<Text style={styles.infoText}>
					SSL Pinning protege seu app contra ataques man-in-the-middle verificando a autenticidade
					dos certificados SSL dos servidores.
				</Text>
			</View>

			<View style={styles.buttonContainer}>
				<Button
					title='Requisição Padrão (Sem Pinning)'
					onPress={handleStandardRequest}
					disabled={loading}
				/>
			</View>

			<View style={styles.buttonContainer}>
				<Button
					title='Requisição Segura (Com Pinning)'
					onPress={handleSecureRequest}
					disabled={loading}
				/>
			</View>

			<View style={styles.buttonContainer}>
				<Button title='SSL Pinning Dinâmico' onPress={handleDynamicPinning} disabled={loading} />
			</View>

			<View style={styles.buttonContainer}>
				<Button title='Atualizar Certificados' onPress={handleUpdatePins} disabled={loading} />
			</View>

			<View style={styles.buttonContainer}>
				<Button title='Verificar Módulo Nativo' onPress={checkNativeModule} disabled={loading} />
			</View>

			<View style={styles.buttonContainer}>
				<Button title='Informações da Plataforma' onPress={showPlatformInfo} disabled={loading} />
			</View>

			{loading && <Text style={styles.loading}>Carregando...</Text>}

			{result ? (
				<View style={styles.resultContainer}>
					<Text style={styles.resultTitle}>Resultado:</Text>
					<Text style={styles.resultText}>{result}</Text>
				</View>
			) : null}
		</View>
	);
};

const styles = StyleSheet.create({
	container: {
		flex: 1,
		padding: 16,
	},
	title: {
		fontSize: 24,
		fontWeight: 'bold',
		marginBottom: 16,
	},
	infoContainer: {
		backgroundColor: '#f0f0f0',
		padding: 16,
		borderRadius: 8,
		marginBottom: 16,
	},
	infoText: {
		fontSize: 14,
	},
	buttonContainer: {
		marginBottom: 12,
	},
	loading: {
		textAlign: 'center',
		marginVertical: 16,
		fontStyle: 'italic',
	},
	resultContainer: {
		marginTop: 16,
		padding: 16,
		backgroundColor: '#f5f5f5',
		borderRadius: 8,
	},
	resultTitle: {
		fontSize: 18,
		fontWeight: 'bold',
		marginBottom: 8,
	},
	resultText: {
		fontSize: 14,
	},
});

export default SSLPinningExample;
