# SSL Pinning Documentation

Este documento explica os comentários removidos dos arquivos de implementação do SSL Pinning, fornecendo detalhes sobre o propósito e funcionamento de cada componente.

## Sumário
1. [Conceitos Básicos](#conceitos-básicos)
2. [Tipos e Interfaces](#tipos-e-interfaces)
3. [Implementação Nativa para iOS](#implementação-nativa-para-ios)
4. [Implementação Nativa para Android](#implementação-nativa-para-android)
5. [Adaptadores para Clientes HTTP](#adaptadores-para-clientes-http)
6. [Integração com a Arquitetura HTTP](#integração-com-a-arquitetura-http)
7. [Guia de Uso](#guia-de-uso)

## Conceitos Básicos

**SSL Pinning** é uma técnica de segurança que protege seu aplicativo contra ataques de Man-in-the-Middle (MITM) verificando se o certificado do servidor corresponde a um certificado ou hash previamente conhecido e confiável.

### Modos de SSL Pinning

A implementação suporta três modos de pinning:

- **CERTIFICATE**: Compara o certificado inteiro do servidor
- **PUBLIC_KEY**: Compara apenas a chave pública do certificado
- **SHA256**: Compara o hash SHA-256 do certificado (mais comum e flexível)

## Tipos e Interfaces

### `src/infra/http/security/SSLPinningTypes.ts`

Este arquivo define os tipos e interfaces fundamentais para configuração do SSL Pinning:

- `PinningMode`: Enumeração dos modos de pinning suportados
- `SSLPinningConfig`: Configuração completa para SSL Pinning
  - `enabled`: Ativa/desativa o SSL Pinning
  - `mode`: O modo de pinning utilizado (CERTIFICATE, PUBLIC_KEY, SHA256)
  - `pins`: Array de strings contendo os certificados ou hashes a serem pinados
  - `rejectUnauthorized`: Se falso, permite conexões com certificados inválidos (útil em desenvolvimento)
  - `trustedCAs`: CAs confiáveis adicionais
  - `hosts`: Lista de hosts onde o pinning será aplicado (se vazio, aplica a todos)

- `SSLPinningManager`: Interface que define os métodos para gerenciar o SSL Pinning
  - `configure()`: Configura o SSL Pinning com as opções especificadas
  - `verify()`: Verifica um certificado de servidor em relação aos pinned certificates
  - `getConfig()`: Obtém a configuração atual
  - `updatePins()`: Atualiza os certificados pinados
  - `setEnabled()`: Ativa/desativa o SSL Pinning

### `src/infra/http/security/SSLPinningManager.ts`

Implementação padrão do gerenciador de SSL Pinning:

- `DefaultSSLPinningManager`: Implementa a interface SSLPinningManager
  - Gerencia a configuração de pinning
  - Implementa a lógica de verificação de certificados
  - Oferece métodos para cada modo de pinning (certificate, public key, SHA256)
  - Contém métodos auxiliares para extração e comparação de certificados

## Implementação Nativa para iOS

### `ios/SSLPinningModule.swift`

Este módulo nativo para iOS implementa a verificação de certificados no nível do sistema operacional:

- `PinningMode`: Enumeração dos modos de pinning suportados
- `SSLPinning`: Classe principal que lida com o pinning
  - `setup()`: Configura o pinning com parâmetros do React Native
  - `setupSSLPinning()`: Inicializa as estruturas de dados para pinning
  - `setupURLSessionDelegate()`: Na implementação real, substitui o delegado do URLSession para interceptar todas as conexões
  - Métodos de validação para cada modo de pinning:
    - `validateWithCertificates()`
    - `validateWithPublicKeys()`
    - `validateWithHashes()`
  - Métodos utilitários para processamento de certificados:
    - `getPublicKey()`: Extrai chave pública do certificado
    - `sha256()`: Calcula hash SHA-256 do certificado
    - `comparePublicKeys()`: Compara chaves públicas

**Nota importante**: O método `setupURLSessionDelegate()` está vazio na implementação atual. Em uma implementação real, você precisaria usar method swizzling ou um URLSessionDelegate personalizado para interceptar todas as requisições de rede.

## Implementação Nativa para Android

### `android/app/src/main/java/com/yourapp/SSLPinningModule.java`

Implementação nativa do SSL Pinning para Android:

- `PinningMode`: Enumeração dos modos de pinning
- `SSLPinningModule`: Classe principal que implementa o módulo nativo React Native
  - `setup()`: Configura o pinning com parâmetros do React Native
  - `setupSSLPinning()`: Configura um TrustManager personalizado que verifica os certificados
    - Substitui o SSLSocketFactory padrão do HttpsURLConnection
    - Implementa um HostnameVerifier personalizado
  - Implementa um X509TrustManager personalizado para:
    - Verificar certificados de servidor
    - Rejeitar certificados que não correspondem aos pinados
  - Métodos de validação para cada modo de pinning:
    - `validateWithCertificates()`
    - `validateWithPublicKeys()`
    - `validateWithHashes()`
  - Métodos utilitários:
    - `extractPublicKey()`: Extrai chave pública do certificado
    - `sha256()`: Calcula hash SHA-256 do certificado

## Adaptadores para Clientes HTTP

### `src/infra/http/security/NativeSSLPinning.ts`

Uma classe que fornece uma ponte para as implementações nativas de SSL Pinning:

- `SSLPinningModule`: Interface para o módulo nativo
- `NativeSSLPinning`: Classe que encapsula a interação com o módulo nativo
  - `isAvailable()`: Verifica se o módulo nativo está disponível
  - `configure()`: Configura o pinning nativo
  - `isEnabled()`: Verifica se o pinning está ativado
  - `setEnabled()`: Ativa/desativa o pinning
  - `updatePins()`: Atualiza os certificados pinados

### `src/infra/http/security/AxiosSSLPinningAdapter.ts`

Adaptador para integrar SSL Pinning com o Axios:

- `AxiosSSLPinningAdapter`: Classe principal
  - `configure()`: Configura SSL Pinning (nativo para React Native, web para outras plataformas)
  - `applyToAxiosConfig()`: Modifica a configuração do Axios para aplicar o pinning
  - `configureNativePinning()`: Configura pinning usando módulos nativos
  - `configureWebPinning()`: Configuração para plataformas web (limitada)

**Nota**: A implementação para web é limitada, pois os navegadores não oferecem acesso direto à verificação de certificados SSL.

### `src/infra/http/security/FetchSSLPinningAdapter.ts`

Adaptador para integrar SSL Pinning com a Fetch API:

- `FetchSSLPinningAdapter`: Classe principal
  - `configure()`: Configura SSL Pinning
  - `applyToFetchOptions()`: Modifica as opções do Fetch para aplicar o pinning
  - `createFetchWithPinning()`: Cria versão personalizada da função fetch com pinning
  - `configureNativePinning()`: Configura pinning usando módulos nativos

## Integração com a Arquitetura HTTP

### `src/domain/services/ApiServiceFactory.ts`

A factory para serviços de API foi estendida para suportar SSL Pinning:

- `ApiServiceOptions`: Interface estendida com propriedade `sslPinning`
- Métodos úteis para criar serviços com SSL Pinning:
  - `createWithSSLPinning()`: Cria serviço com qualquer modo de pinning
  - `createWithSSLPinningSHA256()`: Atalho para pinning com hashes SHA-256
  - `createWithSSLPinningCertificate()`: Atalho para pinning com certificados completos

## Guia de Uso
## Obter os Hashes SHA-256 dos Certificados
Primeiro, obtenha os hashes SHA-256 dos certificados dos servidores que deseja pinar:

```bash
# Para obter o hash SHA-256 do certificado de um site
openssl s_client -servername api.example.com -connect api.example.com:443 < /dev/null | \
  openssl x509 -outform DER | \
  openssl dgst -sha256 -binary | \
  base64
```

## Configurar SSL Pinning no ApiServiceFactory

Método básico:

```typescript
const userService = ApiServiceFactory.createWithSSLPinningSHA256<User>('users', {
  baseURL: 'https://api.example.com',
  pins: [
    'hash1_em_base64',
    'hash2_em_base64'
  ],
  getToken: getAuthToken
});
```

Ou usando a configuração avançada:
```typescript
const advancedService = ApiServiceFactory.create<User>('users', {
  baseURL: 'https://api.example.com',
  sslPinning: {
    enabled: true,
    mode: PinningMode.SHA256,
    pins: ['hash1_em_base64', 'hash2_em_base64'],
    hosts: ['api.example.com'], // Opcional: restringe o pinning a domínios específicos
    rejectUnauthorized: true
  }
});
```

## Tratar Erros de Pinning
```typescript
try {
  const data = await userService.getAll();
  // Sucesso - o certificado do servidor foi validado
} catch (error) {
  if (error instanceof NetworkError) {
    // Pode indicar falha na validação do certificado
    console.error('Falha de SSL Pinning ou conexão');
  }
}
```

## Instalação Nativa
Para usar SSL Pinning completo, você precisa instalar os módulos nativos:

1. Copie SSLPinningModule.swift e SSLPinningModule.m para seu projeto iOS
2. Copie SSLPinningModule.java e SSLPinningPackage.java para seu projeto Android
3. Registre o pacote nativo no MainApplication.java do Android
