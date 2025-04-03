package com.yourapp;

import androidx.annotation.NonNull;
import androidx.annotation.Nullable;

import com.facebook.react.bridge.Promise;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReactContextBaseJavaModule;
import com.facebook.react.bridge.ReactMethod;
import com.facebook.react.bridge.ReadableArray;
import com.facebook.react.bridge.ReadableMap;

import java.io.ByteArrayInputStream;
import java.security.MessageDigest;
import java.security.cert.CertificateException;
import java.security.cert.CertificateFactory;
import java.security.cert.X509Certificate;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

import javax.net.ssl.HostnameVerifier;
import javax.net.ssl.HttpsURLConnection;
import javax.net.ssl.SSLContext;
import javax.net.ssl.SSLSession;
import javax.net.ssl.TrustManager;
import javax.net.ssl.X509TrustManager;

import android.util.Base64;
import android.util.Log;

public class SSLPinningModule extends ReactContextBaseJavaModule {
    private static final String TAG = "SSLPinningModule";
    
    private enum PinningMode {
        CERTIFICATE,
        PUBLIC_KEY,
        SHA256
    }
    
    private PinningMode pinningMode = PinningMode.SHA256;
    private List<byte[]> certificates = new ArrayList<>();
    private List<byte[]> publicKeys = new ArrayList<>();
    private List<String> hashes = new ArrayList<>();
    private List<String> enabledDomains = new ArrayList<>();
    private boolean isEnabled = false;
    private boolean rejectUnauthorized = true;
    
    public SSLPinningModule(ReactApplicationContext reactContext) {
        super(reactContext);
    }

    @NonNull
    @Override
    public String getName() {
        return "SSLPinning";
    }
    
    @ReactMethod
    public void setup(ReadableMap config, Promise promise) {
        try {
            ReadableArray certs = config.getArray("certs");
            String modeString = config.hasKey("mode") ? config.getString("mode") : "sha256";
            
            if (certs == null) {
                promise.reject("setup_error", "Missing certificates");
                return;
            }
            
            pinningMode = PinningMode.SHA256;
            if ("certificate".equals(modeString)) {
                pinningMode = PinningMode.CERTIFICATE;
            } else if ("publicKey".equals(modeString)) {
                pinningMode = PinningMode.PUBLIC_KEY;
            }
            
            if (config.hasKey("enabledDomains")) {
                ReadableArray domains = config.getArray("enabledDomains");
                if (domains != null) {
                    enabledDomains.clear();
                    for (int i = 0; i < domains.size(); i++) {
                        enabledDomains.add(domains.getString(i));
                    }
                }
            }
            
            if (config.hasKey("rejectUnauthorized")) {
                rejectUnauthorized = config.getBoolean("rejectUnauthorized");
            }
            
            certificates.clear();
            publicKeys.clear();
            hashes.clear();
            
            for (int i = 0; i < certs.size(); i++) {
                String certString = certs.getString(i);
                
                switch (pinningMode) {
                    case CERTIFICATE:
                        byte[] certData = Base64.decode(certString, Base64.DEFAULT);
                        certificates.add(certData);
                        break;
                        
                    case PUBLIC_KEY:
                        certData = Base64.decode(certString, Base64.DEFAULT);
                        byte[] publicKey = extractPublicKey(certData);
                        if (publicKey != null) {
                            publicKeys.add(publicKey);
                        }
                        break;
                        
                    case SHA256:
                        hashes.add(certString);
                        break;
                }
            }
            
            setupSSLPinning();
            
            isEnabled = true;
            promise.resolve(true);
        } catch (Exception e) {
            Log.e(TAG, "Error setting up SSL pinning", e);
            promise.reject("setup_error", "Error setting up SSL pinning: " + e.getMessage(), e);
        }
    }
    
    private void setupSSLPinning() {
        try {
            TrustManager[] trustManagers = new TrustManager[]{
                new X509TrustManager() {
                    @Override
                    public void checkClientTrusted(X509Certificate[] chain, String authType) throws CertificateException {
                    }

                    @Override
                    public void checkServerTrusted(X509Certificate[] chain, String authType) throws CertificateException {
                        if (!isEnabled) {
                            return;
                        }
                        
                        if (!validateCertificate(chain)) {
                            throw new CertificateException("Certificate validation failed");
                        }
                    }

                    @Override
                    public X509Certificate[] getAcceptedIssuers() {
                        return new X509Certificate[0];
                    }
                }
            };
            
            SSLContext sslContext = SSLContext.getInstance("TLS");
            sslContext.init(null, trustManagers, null);
            
            HttpsURLConnection.setDefaultSSLSocketFactory(sslContext.getSocketFactory());
            HttpsURLConnection.setDefaultHostnameVerifier(new HostnameVerifier() {
                @Override
                public boolean verify(String hostname, SSLSession session) {
                    if (!isEnabled) {
                        return true;
                    }
                    
                    if (!enabledDomains.isEmpty()) {
                        boolean shouldValidate = false;
                        for (String domain : enabledDomains) {
                            if (hostname.equals(domain) || hostname.endsWith("." + domain)) {
                                shouldValidate = true;
                                break;
                            }
                        }
                        
                        if (!shouldValidate) {
                            return true;
                        }
                    }
                    
                    return !rejectUnauthorized;
                }
            });
        } catch (Exception e) {
            Log.e(TAG, "Error setting up SSL pinning", e);
        }
    }
    
    private boolean validateCertificate(X509Certificate[] chain) {
        if (chain == null || chain.length == 0) {
            return false;
        }
        
        try {
            switch (pinningMode) {
                case CERTIFICATE:
                    return validateWithCertificates(chain);
                    
                case PUBLIC_KEY:
                    return validateWithPublicKeys(chain);
                    
                case SHA256:
                    return validateWithHashes(chain);
                    
                default:
                    return false;
            }
        } catch (Exception e) {
            Log.e(TAG, "Error validating certificate", e);
            return false;
        }
    }
    
    private boolean validateWithCertificates(X509Certificate[] chain) {
        for (X509Certificate cert : chain) {
            byte[] certData = cert.getEncoded();
            
            for (byte[] trustedCert : certificates) {
                if (Arrays.equals(certData, trustedCert)) {
                    return true;
                }
            }
        }
        
        return false;
    }
    
    private boolean validateWithPublicKeys(X509Certificate[] chain) {
        for (X509Certificate cert : chain) {
            byte[] publicKeyData = cert.getPublicKey().getEncoded();
            
            for (byte[] trustedKey : publicKeys) {
                if (Arrays.equals(publicKeyData, trustedKey)) {
                    return true;
                }
            }
        }
        
        return false;
    }
    
    private boolean validateWithHashes(X509Certificate[] chain) throws Exception {
        for (X509Certificate cert : chain) {
            byte[] certData = cert.getEncoded();
            String certHash = sha256(certData);
            
            for (String trustedHash : hashes) {
                if (certHash.equalsIgnoreCase(trustedHash)) {
                    return true;
                }
            }
        }
        
        return false;
    }
    
    private byte[] extractPublicKey(byte[] certData) {
        try {
            CertificateFactory cf = CertificateFactory.getInstance("X.509");
            X509Certificate cert = (X509Certificate) cf.generateCertificate(new ByteArrayInputStream(certData));
            return cert.getPublicKey().getEncoded();
        } catch (Exception e) {
            Log.e(TAG, "Error extracting public key", e);
            return null;
        }
    }
    
    private String sha256(byte[] data) throws Exception {
        MessageDigest md = MessageDigest.getInstance("SHA-256");
        md.update(data);
        byte[] digest = md.digest();
        
        StringBuilder sb = new StringBuilder();
        for (byte b : digest) {
            sb.append(String.format("%02x", b));
        }
        
        return sb.toString();
    }
    
    @ReactMethod
    public void isEnabled(Promise promise) {
        promise.resolve(isEnabled);
    }
    
    @ReactMethod
    public void setEnabled(boolean enabled, Promise promise) {
        isEnabled = enabled;
        promise.resolve(null);
    }
    
    @ReactMethod
    public void updatePins(ReadableArray pins, Promise promise) {
        try {
            certificates.clear();
            publicKeys.clear();
            hashes.clear();
            
            for (int i = 0; i < pins.size(); i++) {
                String pinString = pins.getString(i);
                
                switch (pinningMode) {
                    case CERTIFICATE:
                        byte[] certData = Base64.decode(pinString, Base64.DEFAULT);
                        certificates.add(certData);
                        break;
                        
                    case PUBLIC_KEY:
                        certData = Base64.decode(pinString, Base64.DEFAULT);
                        byte[] publicKey = extractPublicKey(certData);
                        if (publicKey != null) {
                            publicKeys.add(publicKey);
                        }
                        break;
                        
                    case SHA256:
                        hashes.add(pinString);
                        break;
                }
            }
            
            promise.resolve(null);
        } catch (Exception e) {
            Log.e(TAG, "Error updating pins", e);
            promise.reject("update_error", "Error updating pins: " + e.getMessage(), e);
        }
    }
}
