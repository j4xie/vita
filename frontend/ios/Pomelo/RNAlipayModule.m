//
//  RNAlipayModule.m
//  Pomelo
//
//  支付宝SDK React Native桥接模块实现
//  Alipay SDK React Native Bridge Module Implementation
//

#import "RNAlipayModule.h"
#import <AlipaySDK/AlipaySDK.h>

// 静态变量保存模块实例，用于AppDelegate回调
static RNAlipayModule *_instance = nil;

@implementation RNAlipayModule

RCT_EXPORT_MODULE(RNAlipay);

+ (id)allocWithZone:(NSZone *)zone {
  static dispatch_once_t onceToken;
  dispatch_once(&onceToken, ^{
    _instance = [super allocWithZone:zone];
  });
  return _instance;
}

// 支持事件发送
- (NSArray<NSString *> *)supportedEvents {
  return @[@"AlipayPaymentResult"];
}

// 允许在主队列之外初始化
+ (BOOL)requiresMainQueueSetup {
  return NO;
}

#pragma mark - 支付方法

/**
 * 发起支付宝支付
 * Initiate Alipay payment
 *
 * @param orderString 支付宝订单字符串（从后端获取）
 * @param scheme 应用URL Scheme（用于支付完成后返回app）
 * @param resolver Promise resolve
 * @param rejecter Promise reject
 */
RCT_EXPORT_METHOD(pay:(NSString *)orderString
                  scheme:(NSString *)scheme
                  resolver:(RCTPromiseResolveBlock)resolve
                  rejecter:(RCTPromiseRejectBlock)reject)
{
  NSLog(@"💳 [RNAlipay] 开始支付宝支付...");
  NSLog(@"💳 [RNAlipay] orderString: %@", [orderString substringToIndex:MIN(100, orderString.length)]);
  NSLog(@"💳 [RNAlipay] scheme: %@", scheme);

  if (!orderString || orderString.length == 0) {
    NSLog(@"❌ [RNAlipay] orderString为空");
    reject(@"INVALID_ORDER_STRING", @"订单字符串不能为空", nil);
    return;
  }

  // 调用支付宝SDK
  [[AlipaySDK defaultService] payOrder:orderString
                            fromScheme:scheme
                              callback:^(NSDictionary *resultDic) {
    NSLog(@"✅ [RNAlipay] 支付宝回调: %@", resultDic);

    // 发送事件到JavaScript
    [self sendEventWithName:@"AlipayPaymentResult" body:resultDic];

    // 同时通过Promise返回（用于同步调用）
    resolve(resultDic);
  }];
}

/**
 * 获取支付宝SDK版本
 * Get Alipay SDK version
 */
RCT_EXPORT_METHOD(getVersion:(RCTPromiseResolveBlock)resolve
                  rejecter:(RCTPromiseRejectBlock)reject)
{
  NSString *version = [[AlipaySDK defaultService] currentVersion];
  NSLog(@"ℹ️ [RNAlipay] SDK版本: %@", version);
  resolve(version);
}

#pragma mark - URL回调处理

/**
 * 处理支付宝支付回调URL（由AppDelegate调用）
 * Handle Alipay payment callback URL (called by AppDelegate)
 *
 * @param url 回调URL
 * @return 是否成功处理
 */
+ (BOOL)handleOpenURL:(NSURL *)url {
  if ([url.host isEqualToString:@"safepay"]) {
    NSLog(@"🔗 [RNAlipay] 收到支付宝回调URL: %@", url);

    // 支付宝SDK处理回调
    [[AlipaySDK defaultService] processOrderWithPaymentResult:url
                                              standbyCallback:^(NSDictionary *resultDic) {
      NSLog(@"✅ [RNAlipay] 支付宝standby回调: %@", resultDic);

      // 发送事件到JavaScript
      if (_instance) {
        [_instance sendEventWithName:@"AlipayPaymentResult" body:resultDic];
      }
    }];

    return YES;
  }

  return NO;
}

@end
