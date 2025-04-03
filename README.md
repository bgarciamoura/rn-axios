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
8. [Verificando e Testando o SSL Pinning](#verificando-e-testando-o-ssl-pinning)

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


## Verificando e Testando o SSL Pinning

Para verificar se o SSL Pinning está funcionando corretamente, você pode utilizar as seguintes abordagens:

### 1. Teste usando um Proxy de Depuração

Esta é a forma mais convincente de verificar que o SSL Pinning está funcionando:

#### Configuração:
1. **Instale um proxy de HTTPS** como Charles Proxy, Fiddler ou mitmproxy
2. **Configure seu dispositivo/emulador** para usar este proxy:
   - iOS: Configurações > Wi-Fi > [Sua rede] > Configurar Proxy > Manual
   - Android: Configurações > Wi-Fi > [Sua rede] > Modificar > Configurações avançadas > Proxy > Manual
3. **Instale o certificado CA do proxy** no dispositivo:
   - iOS: Baixe o certificado no dispositivo e instale através de Configurações > Geral > Perfil
   - Android: Baixe o certificado e instale através de Configurações > Segurança > Instalar do armazenamento

#### Execução do teste:
```typescript
// Adicione esta função em sua tela de teste
const testSSLPinning = async () => {
  // 1. Primeiro, desative o SSL Pinning e faça uma requisição
  await nativeSSLPinning.setEnabled(false);
  console.log("SSL Pinning desativado");
  
  try {
    // Esta requisição deve aparecer no proxy
    const response = await secureUserService.getAll();
    console.log("Requisição sem SSL Pinning: SUCESSO");
  } catch (error) {
    console.log("Requisição sem SSL Pinning: FALHA", error.message);
  }
  
  // 2. Ative o SSL Pinning e faça outra requisição
  await nativeSSLPinning.setEnabled(true);
  console.log("SSL Pinning ativado");
  
  try {
    // Esta requisição deve falhar, pois o proxy está interceptando
    const response = await secureUserService.getAll();
    console.log("Requisição com SSL Pinning: SUCESSO (FALHA NO TESTE)");
  } catch (error) {
    // Isso é esperado! O SSL Pinning deve rejeitar o certificado do proxy
    console.log("Requisição com SSL Pinning: FALHA (ESPERADO)", error.message);
  }
};
```

#### O que observar:
- Com SSL Pinning desativado: As requisições aparecem no proxy e você pode ver os dados transmitidos
- Com SSL Pinning ativado: As requisições falham com erros como "certificate verification failed" ou "trust anchor for certification path not found"

#### Limitações:
- Requer configuração manual do proxy e certificado
- Alguns dispositivos podem ter dificuldade em instalar certificados de CA personalizados

### 2. Logs no Código

Adicione logs detalhados nas implementações nativas para ver o processo de verificação de certificados:

#### Para iOS (em SSLPinningModule.swift):

```swift
func validateCertificate(serverTrust: SecTrust, domain: String?) -> Bool {
    if !self.enabled {
        print("SSL Pinning: Desativado para domínio \(domain ?? "desconhecido")")
        return true
    }
    
    if !self.enabledDomains.isEmpty, let domain = domain {
        let shouldValidate = self.enabledDomains.contains { domain == $0 || domain.hasSuffix(".\($0)") }
        if !shouldValidate {
            print("SSL Pinning: Domínio \(domain) não está na lista de domínios habilitados")
            return true
        }
    }
    
    var result = false
    print("SSL Pinning: Validando certificado para \(domain ?? "desconhecido") usando modo \(self.pinningMode)")
    
    switch self.pinningMode {
    case .certificate:
        result = validateWithCertificates(serverTrust: serverTrust)
        print("SSL Pinning (Certificate): \(result ? "APROVADO" : "REJEITADO")")
        
    case .publicKey:
        result = validateWithPublicKeys(serverTrust: serverTrust)
        print("SSL Pinning (Public Key): \(result ? "APROVADO" : "REJEITADO")")
        
    case .sha256:
        result = validateWithHashes(serverTrust: serverTrust)
        print("SSL Pinning (SHA256): \(result ? "APROVADO" : "REJEITADO")")
    }
    
    let finalResult = result || !self.rejectUnauthorized
    print("SSL Pinning: Resultado final para \(domain ?? "desconhecido"): \(finalResult ? "APROVADO" : "REJEITADO")")
    return finalResult
}

private func validateWithHashes(serverTrust: SecTrust) -> Bool {
    let serverCertificatesCount = SecTrustGetCertificateCount(serverTrust)
    print("SSL Pinning: Verificando \(serverCertificatesCount) certificados contra \(self.hashes.count) hashes")
    
    for index in 0..<serverCertificatesCount {
        guard let serverCertificate = SecTrustGetCertificateAtIndex(serverTrust, index) else {
            print("SSL Pinning: Não foi possível acessar o certificado no índice \(index)")
            continue
        }
        
        let serverCertificateData = SecCertificateCopyData(serverCertificate) as Data
        let serverCertificateHash = sha256(data: serverCertificateData)
        print("SSL Pinning: Hash do certificado \(index): \(serverCertificateHash)")
        
        for (hashIndex, trustedHash) in self.hashes.enumerated() {
            print("SSL Pinning: Comparando com hash \(hashIndex): \(trustedHash)")
            if serverCertificateHash.lowercased() == trustedHash.lowercased() {
                print("SSL Pinning: Match encontrado!")
                return true
            }
        }
    }
    
    print("SSL Pinning: Nenhum match encontrado para certificados")
    return false
}
```

#### Para Android (em SSLPinningModule.java):

```java
private boolean validateCertificate(X509Certificate[] chain) {
    if (chain == null || chain.length == 0) {
        Log.d(TAG, "Validação de certificado: Falha - não há certificados na chain");
        return false;
    }
    
    try {
        Log.d(TAG, "Validação de certificado: Verificando " + chain.length + " certificados usando modo " + pinningMode);
        
        switch (pinningMode) {
            case CERTIFICATE:
                boolean certResult = validateWithCertificates(chain);
                Log.d(TAG, "Validação de certificado (modo CERTIFICATE): " + (certResult ? "APROVADO" : "REJEITADO"));
                return certResult;
                
            case PUBLIC_KEY:
                boolean keyResult = validateWithPublicKeys(chain);
                Log.d(TAG, "Validação de certificado (modo PUBLIC_KEY): " + (keyResult ? "APROVADO" : "REJEITADO"));
                return keyResult;
                
            case SHA256:
                boolean hashResult = validateWithHashes(chain);
                Log.d(TAG, "Validação de certificado (modo SHA256): " + (hashResult ? "APROVADO" : "REJEITADO"));
                return hashResult;
                
            default:
                Log.d(TAG, "Validação de certificado: Modo desconhecido: " + pinningMode);
                return false;
        }
    } catch (Exception e) {
        Log.e(TAG, "Erro na validação do certificado", e);
        return false;
    }
}

private boolean validateWithHashes(X509Certificate[] chain) throws Exception {
    for (int i = 0; i < chain.length; i++) {
        X509Certificate cert = chain[i];
        byte[] certData = cert.getEncoded();
        String certHash = sha256(certData);
        
        Log.d(TAG, "Certificado " + i + " Hash: " + certHash);
        
        for (int j = 0; j < hashes.size(); j++) {
            String trustedHash = hashes.get(j);
            Log.d(TAG, "Comparando com hash " + j + ": " + trustedHash);
            
            if (certHash.equalsIgnoreCase(trustedHash)) {
                Log.d(TAG, "Match encontrado!");
                return true;
            }
        }
    }
    
    Log.d(TAG, "Nenhum hash corresponde aos certificados pinados");
    return false;
}
```

#### Como usar os logs:
1. **Adicione filtros de log** no Logcat (Android) ou Console (iOS) para ver apenas os logs do SSL Pinning
2. **Faça requisições de teste** com SSL Pinning ativado e desativado
3. **Observe os logs** para ver exatamente o que está acontecendo durante a verificação

#### Vantagens:
- Mostra detalhes internos do processo de verificação
- Ajuda a identificar problemas específicos (ex: hash incorreto, formato errado)
- Não requer configuração externa (como proxy)

### 3. Análise do Tráfego de Rede

Para uma análise mais profunda, você pode examinar o tráfego de rede em dispositivos com root/jailbreak:

#### Ferramentas:
- **Wireshark**: Para captura e análise detalhada de pacotes
- **tcpdump**: Para captura de pacotes em dispositivos Android com root
- **SSLsplit**: Para testes avançados de interceptação HTTPS

#### Em dispositivos Android com root:

```bash
# Instale o tcpdump no dispositivo
adb shell su -c "mount -o rw,remount /system"
adb push tcpdump /system/bin/
adb shell su -c "chmod 755 /system/bin/tcpdump"

# Capture o tráfego
adb shell su -c "tcpdump -n -s 0 -w /sdcard/capture.pcap 'host api.example.com'"

# Em outro terminal, execute sua aplicação e faça requisições

# Copie o arquivo de captura para o PC
adb pull /sdcard/capture.pcap

# Abra o arquivo no Wireshark para análise
```

#### Análise no Wireshark:
1. Abra o arquivo de captura com Wireshark
2. Filtre por `ssl` ou `tls`
3. Procure por handshakes TLS e alertas

#### O que observar:
- **Com SSL Pinning ativo**: Você verá alertas TLS como "certificate_unknown" ou "bad_certificate"
- **Com SSL Pinning inativo**: Você verá handshakes TLS completados com sucesso

#### Análise de Handshake TLS:
Procure por pacotes de handshake TLS e inspecione os certificados trocados:

1. **Client Hello**: Início da conexão pelo cliente
2. **Server Hello + Certificate**: Servidor enviando seus certificados 
3. **Certificate Verify**: Verificação do certificado (onde o SSL Pinning atua)
4. **Alert**: Alertas de falha (se o certificado for rejeitado)

#### Limitações:
- Requer dispositivo com root/jailbreak
- Complexidade técnica mais alta
- Muitos detalhes de baixo nível que podem ser difíceis de interpretar

### Combinando Métodos

Para uma verificação mais completa, combine os métodos:

1. **Configure logs detalhados** nas implementações nativas
2. **Use um proxy como Charles** com e sem SSL Pinning ativado
3. **Capture o tráfego com Wireshark** para análise detalhada
4. **Crie testes automatizados** que verificam o comportamento correto

Isso fornecerá evidências claras de que o SSL Pinning está funcionando corretamente e proteção sua aplicação contra ataques MITM.

