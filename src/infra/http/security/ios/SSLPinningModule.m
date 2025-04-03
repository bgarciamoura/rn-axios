#import <React/RCTBridgeModule.h>

@interface RCT_EXTERN_MODULE(SSLPinning, NSObject)

RCT_EXTERN_METHOD(setup:(NSDictionary *)config
                  resolver:(RCTPromiseResolveBlock)resolve
                  rejecter:(RCTPromiseRejectBlock)reject);

RCT_EXTERN_METHOD(isEnabled:(RCTPromiseResolveBlock)resolve
                  rejecter:(RCTPromiseRejectBlock)reject);

RCT_EXTERN_METHOD(setEnabled:(BOOL)enabled
                  resolver:(RCTPromiseResolveBlock)resolve
                  rejecter:(RCTPromiseRejectBlock)reject);

RCT_EXTERN_METHOD(updatePins:(NSArray *)pins
                  resolver:(RCTPromiseResolveBlock)resolve
                  rejecter:(RCTPromiseRejectBlock)reject);

@end
