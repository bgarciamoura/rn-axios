import Foundation

// Este arquivo demonstra como usar o módulo de SSL Pinning no código nativo iOS

class APIClient {
  private let sslPinningModule: SSLPinning
  
  init(sslPinningModule: SSLPinning) {
    self.sslPinningModule = sslPinningModule
  }
  
  func fetchData(from urlString: String, completion: @escaping (Data?, Error?) -> Void) {
    guard let url = URL(string: urlString) else {
      completion(nil, NSError(domain: "Invalid URL", code: -1, userInfo: nil))
      return
    }
    
    // Use a sessão compartilhada que tem o delegate de SSL Pinning configurado
    let session = sslPinningModule.getSharedSession()
    
    let task = session.dataTask(with: url) { (data, response, error) in
      completion(data, error)
    }
    
    task.resume()
  }
}

// Exemplo de como usar o APIClient com SSL Pinning
class ExampleViewController {
  private var apiClient: APIClient!
  private let sslPinningModule = SSLPinning()
  
  func setupSSLPinning() {
    // Exemplo de configuração via código
    let config: [String: Any] = [
      "certs": ["certificate_hash_base64_1", "certificate_hash_base64_2"],
      "mode": "sha256",
      "enabledDomains": ["api.example.com", "api2.example.com"],
      "rejectUnauthorized": true
    ]
    
    sslPinningModule.setup(config as NSDictionary, 
                          resolver: { _ in
                            print("SSL Pinning configurado com sucesso")
                            self.initializeAPIClient()
                          }, 
                          rejecter: { code, message, error in
                            print("Erro ao configurar SSL Pinning: \(message ?? "")")
                          })
  }
  
  private func initializeAPIClient() {
    apiClient = APIClient(sslPinningModule: sslPinningModule)
  }
  
  func fetchUserData() {
    apiClient.fetchData(from: "https://api.example.com/users") { (data, error) in
      if let error = error {
        // O erro pode ter ocorrido devido à falha no SSL Pinning
        print("Erro ao buscar dados: \(error.localizedDescription)")
        return
      }
      
      guard let data = data else {
        print("Nenhum dado recebido")
        return
      }
      
      // Processa os dados
      do {
        let json = try JSONSerialization.jsonObject(with: data, options: [])
        print("Dados recebidos: \(json)")
      } catch {
        print("Erro ao processar JSON: \(error.localizedDescription)")
      }
    }
  }
}

// Exemplo de como usar NSURLSession diretamente com o method swizzling
func exampleURLSessionUse() {
  // Com o method swizzling ativado, todas as sessões URL padrão já terão
  // a proteção de SSL Pinning, sem precisarmos fazer nada especial
  
  let url = URL(string: "https://api.example.com/data")!
  let task = URLSession.shared.dataTask(with: url) { (data, response, error) in
    // Se o certificado não corresponder aos pinos configurados,
    // error não será nil e a requisição terá sido cancelada
    
    if let error = error {
      print("Erro (possivelmente devido ao SSL Pinning): \(error.localizedDescription)")
      return
    }
    
    // Processamento normal da resposta
    print("Requisição bem-sucedida!")
  }
  
  task.resume()
}
