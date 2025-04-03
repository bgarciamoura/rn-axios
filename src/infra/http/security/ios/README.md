# Implementação de SSL Pinning para iOS

Este documento explica a implementação do método `setupURLSessionDelegate()` no módulo `SSLPinningModule.swift` para garantir que o SSL Pinning seja corretamente aplicado em todas as requisições de rede no iOS.

## Visão Geral da Implementação

A implementação realizada combina três abordagens complementares para garantir uma cobertura robusta do SSL Pinning:

1. **URLSessionDelegate Personalizado**: Implementa a validação de certificados no nível da sessão HTTP
2. **Method Swizzling**: Intercepta métodos do URLSession para aplicar SSL Pinning em todas as sessões
3. **NSURLProtocol Personalizado**: Intercepta requisições de rede em um nível ainda mais baixo

## 1. URLSessionDelegate Personalizado

Esta é a abordagem principal e mais direta para implementar SSL Pinning no iOS.

```swift
class SSLPinningURLSessionDelegate: NSObject, URLSessionDelegate {
  weak var sslPinningModule: SSLPinning?
  
  func urlSession(_ session: URLSession, didReceive challenge: URLAuthenticationChallenge, completionHandler: @escaping (URLSession.AuthChallengeDisposition, URLCredential?) -> Void) {
    // Implementa a verificação de certificados aqui
    // ...
  }
}
```

**Como funciona:**
- Criamos um delegate personalizado que implementa o protocolo `URLSessionDelegate`
- Implementamos o método `urlSession(_:didReceive:completionHandler:)` que é chamado durante o handshake SSL
- Neste método, acessamos o certificado do servidor e o validamos contra nossos certificados pinados
- Baseado no resultado, aceitamos ou rejeitamos a conexão

**Vantagens:**
- Abordagem direta e bem documentada pela Apple
- Funciona com qualquer tipo de requisição (GET, POST, etc.)
- Fácil manutenção e depuração

**Limitações:**
- Só funciona com sessões que usam este delegate
- Não intercepta automaticamente requisições feitas com o URLSession.shared padrão

## 2. Method Swizzling

Para garantir que o SSL Pinning seja aplicado mesmo quando o código usa URLSession.shared ou cria suas próprias sessões sem o delegate correto, implementamos method swizzling:

```swift
extension URLSession {
  @objc class func swizzleMethods() {
    // Troca a implementação de dataTask com nossa versão personalizada
    // ...
  }
  
  @objc func swizzled_dataTask(with request: URLRequest, completionHandler: @escaping (Data?, URLResponse?, Error?) -> Void) -> URLSessionDataTask {
    // Lógica personalizada + chamada ao método original
    // ...
  }
}
```

**Como funciona:**
- Usamos Runtime do Objective-C para trocar a implementação de métodos em tempo de execução
- Trocamos a implementação do método `dataTask` para incluir nossa verificação de certificados
- Todas as requisições, mesmo aquelas que não usam nosso delegate, passam por esse código

**Vantagens:**
- Intercepta todas as requisições, mesmo aquelas feitas com URLSession.shared
- Transparente para o código cliente - nenhuma mudança necessária no código existente
- Cobertura abrangente para toda a aplicação

**Limitações:**
- Considerado um "hack" - pode quebrar em versões futuras do iOS
- Difícil de depurar problemas
- A Apple desencoraja o uso extensivo de swizzling

## 3. NSURLProtocol Personalizado

Como camada adicional, implementamos um NSURLProtocol personalizado:

```swift
class SSLPinningURLProtocol: URLProtocol {
  // Implementação que intercepta requisições no nível mais baixo
  // ...
}
```

**Como funciona:**
- NSURLProtocol intercepta requisições HTTP/HTTPS antes mesmo que sejam processadas
- Podemos examinar e modificar requisições ou implementar comportamentos personalizados
- Registramos nosso protocolo personalizado com `URLProtocol.registerClass()`

**Vantagens:**
- Intercepta requisições em nível ainda mais baixo que o URLSessionDelegate
- Pode interceptar requisições de bibliotecas de terceiros como Alamofire que possuem sua própria camada de rede
- Oferece controle granular sobre o processamento de requisições

**Limitações:**
- Mais complexo de implementar corretamente
- Pode haver problemas de performance
- Potenciais loops infinitos se não for implementado com cuidado

## Aplicando a Implementação

O método `setupURLSessionDelegate()` ativa as três abordagens:

```swift
private func setupURLSessionDelegate() {
  // 1. Configura o delegate personalizado
  let config = URLSessionConfiguration.default
  self.sharedSession = URLSession(configuration: config, delegate: sessionDelegate, delegateQueue: nil)
  
  // 2. Ativa o method swizzling
  URLSession.swizzleMethods()
  
  // 3. Registra o NSURLProtocol personalizado
  setupURLProtocol()
}
```

A classe `SSLPinning` também expõe um método `getSharedSession()` que retorna uma sessão URL configurada com o delegate de SSL Pinning, permitindo que código cliente use essa sessão diretamente.

## Uso na Prática

Para garantir que o SSL Pinning funcione corretamente, o código cliente deve usar a sessão compartilhada fornecida pelo módulo:

```swift
// Abordagem recomendada
let session = sslPinningModule.getSharedSession()
let task = session.dataTask(with: url) { ... }
task.resume()
```

Alternativamente, graças ao method swizzling e NSURLProtocol, mesmo o código que usa URLSession.shared estará protegido:

```swift
// Também protegido pelo SSL Pinning devido ao swizzling
let task = URLSession.shared.dataTask(with: url) { ... }
task.resume()
```

## Considerações Importantes

1. **Desempenho**: O SSL Pinning adiciona overhead a cada requisição. Em aplicativos com muitas requisições, isso pode ser perceptível.

2. **Depuração**: Lembre-se de desativar o SSL Pinning ao depurar com proxies como Charles ou Fiddler:
   ```swift
   sslPinningModule.setEnabled(false, resolver: { _ in }, rejecter: { _, _, _ in })
   ```

3. **Atualizações de Certificado**: Tenha um mecanismo para atualizar os certificados pinados quando eles expirarem.

4. **Testes**: Teste exaustivamente o SSL Pinning com certificados válidos e inválidos para garantir que funcione conforme esperado.

5. **Botão de Emergência**: Implemente um mecanismo para desativar o SSL Pinning remotamente caso ocorram problemas em produção.

## Recursos Adicionais

Para uma compreensão mais profunda do SSL Pinning no iOS, consulte:

- [Apple's Certificate, Key, and Trust Services](https://developer.apple.com/documentation/security/certificate_key_and_trust_services)
- [OWASP Mobile Security Testing Guide - iOS Network Communication](https://mobile-security.gitbook.io/mobile-security-testing-guide/ios-testing-guide/0x06g-testing-network-communication)
- [Technical Note TN2232: HTTPS Server Trust Evaluation](https://developer.apple.com/library/archive/technotes/tn2232/_index.html)
