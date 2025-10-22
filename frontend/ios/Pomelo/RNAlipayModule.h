//
//  RNAlipayModule.h
//  Pomelo
//
//  支付宝SDK React Native桥接模块
//  Alipay SDK React Native Bridge Module
//

#import <React/RCTBridgeModule.h>
#import <React/RCTEventEmitter.h>

@interface RNAlipayModule : RCTEventEmitter <RCTBridgeModule>

/**
 * 处理支付宝支付回调结果
 * Handle Alipay payment callback result
 *
 * @param url 支付宝回调URL
 * @return 是否成功处理
 */
+ (BOOL)handleOpenURL:(NSURL *)url;

@end
