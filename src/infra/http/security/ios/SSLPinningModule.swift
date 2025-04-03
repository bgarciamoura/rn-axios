import Foundation
import React
import Security
import CommonCrypto

enum PinningMode: String {
  case certificate = "certificate"
  case publicKey = "publicKey"
  case sha256 = "sha256"
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
}
