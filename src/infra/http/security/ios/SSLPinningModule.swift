import Foundation
import React
import Security
import CommonCrypto

enum PinningMode: String {
  case certificate = "certificate"
  case publicKey = "publicKey"
  case sha256 = "sha256"
}

class SSLPinningURLSessionDelegate: NSObject, URLSessionDelegate {
  weak var sslPinningModule: SSLPinning?
  
  init(sslPinningModule: SSLPinning) {
    self.sslPinningModule = sslPinningModule
    super.init()
  }
  
  func urlSession(_ session: URLSession, didReceive challenge: URLAuthenticationChallenge, completionHandler: @escaping (URLSession.AuthChallengeDisposition, URLCredential?) -> Void) {
    guard let sslPinning = sslPinningModule else {
      // Se o módulo não está disponível, aceita o certificado padrão
      completionHandler(.performDefaultHandling, nil)
      return
    }
    
    let serverTrust = challenge.protectionSpace.serverTrust
    let host = challenge.protectionSpace.host
    
    if let serverTrust = serverTrust, sslPinning.enabled {
      if sslPinning.validateCertificate(serverTrust: serverTrust, domain: host) {
        // Certificado válido, aceita
        let credential = URLCredential(trust: serverTrust)
        completionHandler(.useCredential, credential)
      } else {
        // Certificado inválido, rejeita
        completionHandler(.cancelAuthenticationChallenge, nil)
      }
    } else {
      // Sem SSL Pinning ou sem serverTrust, usa o comportamento padrão
      completionHandler(.performDefaultHandling, nil)
    }
  }
}

// Extensão para swizzling de métodos
extension URLSession {
  static var swizzleImplemented = false
  
  @objc class func swizzleMethods() {
    guard !swizzleImplemented else { return }
    
    let originalSelector = #selector(URLSession.dataTask(with:completionHandler:) as (URLSession) -> (URLRequest, @escaping (Data?, URLResponse?, Error?) -> Void) -> URLSessionDataTask)
    let swizzledSelector = #selector(URLSession.swizzled_dataTask(with:completionHandler:))
    
    guard let originalMethod = class_getInstanceMethod(URLSession.self, originalSelector),
          let swizzledMethod = class_getInstanceMethod(URLSession.self, swizzledSelector) else {
      return
    }
    
    method_exchangeImplementations(originalMethod, swizzledMethod)
    swizzleImplemented = true
  }
  
  @objc func swizzled_dataTask(with request: URLRequest, completionHandler: @escaping (Data?, URLResponse?, Error?) -> Void) -> URLSessionDataTask {
    // Aqui podemos adicionar lógica antes da execução da task
    // Por exemplo, verificar se o host está na lista de domínios com pinning
    
    return self.swizzled_dataTask(with: request, completionHandler: { (data, response, error) in
      // Aqui o método original já foi executado (devido ao swizzling)
      // Podemos adicionar lógica para verificar a resposta se necessário
      
      // Chamamos o completion handler original
      completionHandler(data, response, error)
    })
  }
}

@objc(SSLPinning)
class SSLPinning: NSObject {
  
  private var certificates: [Data] = []
  private var publicKeys: [SecKey] = []
  private var hashes: [String] = []
  private var pinningMode: PinningMode = .sha256
  private var enabledDomains: [String] = []
  private var enabled: Bool = false
  private var rejectUnauthorized: Bool = true
  
  private let sessionDelegate = SSLPinningURLSessionDelegate(sslPinningModule: nil)
  private var sharedSession: URLSession?
  
  override init() {
    super.init()
    sessionDelegate.sslPinningModule = self
  }
  
  @objc
  func setup(_ config: NSDictionary, resolver resolve: @escaping RCTPromiseResolveBlock, rejecter reject: @escaping RCTPromiseRejectBlock) {
    guard let certs = config["certs"] as? [String] else {
      reject("setup_error", "Missing certificates", nil)
      return
    }
    
    let modeString = config["mode"] as? String ?? "sha256"
    let pinningMode = PinningMode(rawValue: modeString) ?? .sha256
    self.pinningMode = pinningMode
    
    self.enabledDomains = config["enabledDomains"] as? [String] ?? []
    self.rejectUnauthorized = config["rejectUnauthorized"] as? Bool ?? true
    
    setupSSLPinning(certificates: certs, mode: pinningMode)
    setupURLSessionDelegate()
    
    self.enabled = true
    resolve(true)
  }
  
  private func setupSSLPinning(certificates: [String], mode: PinningMode) {
    self.certificates = []
    self.publicKeys = []
    self.hashes = []
    
    for certString in certificates {
      switch mode {
      case .certificate:
        if let certData = Data(base64Encoded: certString) {
          self.certificates.append(certData)
        }
        
      case .publicKey:
        if let certData = Data(base64Encoded: certString),
           let cert = SecCertificateCreateWithData(nil, certData as CFData),
           let publicKey = getPublicKey(from: cert) {
          self.publicKeys.append(publicKey)
        }
        
      case .sha256:
        self.hashes.append(certString)
      }
    }
  }
  
  private func setupURLSessionDelegate() {
    // Implementação do método para configurar o SSL Pinning no URLSession
    
    // Abordagem 1: Delegate personalizado
    // Criar uma sessão compartilhada com nosso delegate de SSL Pinning
    let config = URLSessionConfiguration.default
    self.sharedSession = URLSession(configuration: config, delegate: sessionDelegate, delegateQueue: nil)
    
    // Abordagem 2: Method Swizzling
    // Trocar a implementação dos métodos padrão do URLSession para incluir nossa lógica de verificação
    URLSession.swizzleMethods()
    
    // Registre um proxy NSURLProtocol para interceptar todas as requisições (opcional)
    setupURLProtocol()
  }
  
  private func setupURLProtocol() {
    // Classe personalizada de NSURLProtocol para interceptar requisições HTTP/HTTPS
    // Esta seria uma implementação mais avançada para garantir cobertura completa
    class SSLPinningURLProtocol: URLProtocol {
      static weak var sslPinningModule: SSLPinning?
      
      override class func canInit(with request: URLRequest) -> Bool {
        // Verificar se devemos processar esta requisição
        guard let url = request.url, url.scheme == "https" else {
          return false
        }
        
        // Verificar se este host está na lista de domínios para pinning
        if let module = sslPinningModule, !module.enabled {
          return false
        }
        
        // Verificar se já processamos esta requisição
        if URLProtocol.property(forKey: "SSLPinningURLProtocolHandled", in: request) != nil {
          return false
        }
        
        return true
      }
      
      override class func canonicalRequest(for request: URLRequest) -> URLRequest {
        return request
      }
      
      override func startLoading() {
        // Marcar a requisição como já processada para evitar loops
        let mutableRequest = (request as NSURLRequest).mutableCopy() as! NSMutableURLRequest
        URLProtocol.setProperty(true, forKey: "SSLPinningURLProtocolHandled", in: mutableRequest)
        
        // Criar uma sessão para esta requisição que irá usar o delegate de SSL Pinning
        let config = URLSessionConfiguration.default
        let session = URLSession(configuration: config, delegate: Self.sslPinningModule?.sessionDelegate, delegateQueue: nil)
        
        // Iniciar a requisição com a verificação de certificado
        let task = session.dataTask(with: mutableRequest as URLRequest) { (data, response, error) in
          if let error = error {
            self.client?.urlProtocol(self, didFailWithError: error)
            return
          }
          
          if let response = response {
            self.client?.urlProtocol(self, didReceive: response, cacheStoragePolicy: .allowed)
          }
          
          if let data = data {
            self.client?.urlProtocol(self, didLoad: data)
          }
          
          self.client?.urlProtocolDidFinishLoading(self)
        }
        
        task.resume()
      }
      
      override func stopLoading() {
        // Cancelar a requisição se necessário
      }
    }
    
    // Registre o protocolo personalizado
    SSLPinningURLProtocol.sslPinningModule = self
    URLProtocol.registerClass(SSLPinningURLProtocol.self)
  }
  
  private func getPublicKey(from certificate: SecCertificate) -> SecKey? {
    var trust: SecTrust?
    
    let policy = SecPolicyCreateBasicX509()
    let status = SecTrustCreateWithCertificates(certificate, policy, &trust)
    
    guard status == errSecSuccess, let trust = trust else {
      return nil
    }
    
    return SecTrustCopyPublicKey(trust)
  }
  
  private func sha256(data: Data) -> String {
    var hash = [UInt8](repeating: 0, count: Int(CC_SHA256_DIGEST_LENGTH))
    data.withUnsafeBytes {
      _ = CC_SHA256($0.baseAddress, CC_LONG(data.count), &hash)
    }
    return hash.map { String(format: "%02x", $0) }.joined()
  }
  
  func validateCertificate(serverTrust: SecTrust, domain: String?) -> Bool {
    if !self.enabled {
      return true
    }
    
    if !self.enabledDomains.isEmpty, let domain = domain {
      let shouldValidate = self.enabledDomains.contains { domain == $0 || domain.hasSuffix(".\($0)") }
      if !shouldValidate {
        return true
      }
    }
    
    var result = false
    
    switch self.pinningMode {
    case .certificate:
      result = validateWithCertificates(serverTrust: serverTrust)
      
    case .publicKey:
      result = validateWithPublicKeys(serverTrust: serverTrust)
      
    case .sha256:
      result = validateWithHashes(serverTrust: serverTrust)
    }
    
    return result || !self.rejectUnauthorized
  }
  
  private func validateWithCertificates(serverTrust: SecTrust) -> Bool {
    let serverCertificatesCount = SecTrustGetCertificateCount(serverTrust)
    
    for index in 0..<serverCertificatesCount {
      guard let serverCertificate = SecTrustGetCertificateAtIndex(serverTrust, index) else {
        continue
      }
      
      let serverCertificateData = SecCertificateCopyData(serverCertificate) as Data
      
      for trustedCertificateData in self.certificates {
        if serverCertificateData == trustedCertificateData {
          return true
        }
      }
    }
    
    return false
  }
  
  private func validateWithPublicKeys(serverTrust: SecTrust) -> Bool {
    guard let serverPublicKey = SecTrustCopyPublicKey(serverTrust) else {
      return false
    }
    
    for trustedPublicKey in self.publicKeys {
      if comparePublicKeys(serverPublicKey, trustedPublicKey) {
        return true
      }
    }
    
    return false
  }
  
  private func validateWithHashes(serverTrust: SecTrust) -> Bool {
    let serverCertificatesCount = SecTrustGetCertificateCount(serverTrust)
    
    for index in 0..<serverCertificatesCount {
      guard let serverCertificate = SecTrustGetCertificateAtIndex(serverTrust, index) else {
        continue
      }
      
      let serverCertificateData = SecCertificateCopyData(serverCertificate) as Data
      let serverCertificateHash = sha256(data: serverCertificateData)
      
      for trustedHash in self.hashes {
        if serverCertificateHash.lowercased() == trustedHash.lowercased() {
          return true
        }
      }
    }
    
    return false
  }
  
  private func comparePublicKeys(_ key1: SecKey, _ key2: SecKey) -> Bool {
    let key1Data = SecKeyCopyExternalRepresentation(key1, nil) as Data?
    let key2Data = SecKeyCopyExternalRepresentation(key2, nil) as Data?
    
    guard let data1 = key1Data, let data2 = key2Data else {
      return false
    }
    
    return data1 == data2
  }
  
  @objc
  func isEnabled(_ resolve: RCTPromiseResolveBlock, rejecter reject: RCTPromiseRejectBlock) {
    resolve(self.enabled)
  }
  
  @objc
  func setEnabled(_ enabled: Bool, resolver resolve: @escaping RCTPromiseResolveBlock, rejecter reject: @escaping RCTPromiseRejectBlock) {
    self.enabled = enabled
    resolve(nil)
  }
  
  @objc
  func updatePins(_ pins: [String], resolver resolve: @escaping RCTPromiseResolveBlock, rejecter reject: @escaping RCTPromiseRejectBlock) {
    setupSSLPinning(certificates: pins, mode: self.pinningMode)
    resolve(nil)
  }
  
  @objc
  static func requiresMainQueueSetup() -> Bool {
    return false
  }
  
  // Método para obter a sessão URL compartilhada com SSL Pinning
  func getSharedSession() -> URLSession {
    if let session = sharedSession {
      return session
    }
    
    // Se ainda não foi criada, cria uma nova
    let config = URLSessionConfiguration.default
    let newSession = URLSession(configuration: config, delegate: sessionDelegate, delegateQueue: nil)
    sharedSession = newSession
    return newSession
  }
}
