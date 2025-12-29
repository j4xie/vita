package com.ruoyi.system.controller;

import com.alipay.api.AlipayApiException;
import com.alipay.api.AlipayClient;
import com.alipay.api.DefaultAlipayClient;
import com.alipay.api.domain.*;
import com.alipay.api.internal.util.AlipaySignature;
import com.alipay.api.request.*;
import com.alipay.api.response.*;
import com.ruoyi.common.annotation.Anonymous;
import com.ruoyi.common.core.controller.BaseController;
import com.ruoyi.common.core.domain.AjaxResult;
import com.ruoyi.system.pay.AlipayConfig;
import com.ruoyi.system.pay.AlipayUtils;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.web.bind.annotation.*;

import javax.servlet.http.HttpServletRequest;
import java.io.UnsupportedEncodingException;
import java.util.HashMap;
import java.util.Iterator;
import java.util.Map;

/**
 * 支付宝支付控制器
 */
@RestController
@Anonymous
@RequestMapping("/alipay")
public class PayController extends BaseController {

    private static final Logger log = LoggerFactory.getLogger(PayController.class);

    /**
     * 创建订单接口（APP支付）
     * @param subject 订单标题
     * @param totalAmount 订单总金额
     * @param outTradeNo 商户订单号
     * @param body 订单描述
     * @return 订单创建结果
     */
    @PostMapping("/createOrder")
    public AjaxResult createOrder(@RequestParam String subject,
                                  @RequestParam String totalAmount,
                                  @RequestParam String outTradeNo,
                                  @RequestParam(required = false) String body) {
        try {
            log.info("开始处理创建订单请求，订单标题: {}, 总金额: {}, 商户订单号: {}", subject, totalAmount, outTradeNo);
            AlipayTradeAppPayResponse response = AlipayUtils.getInstance().appPay(subject, totalAmount, outTradeNo);
            String orderStr = response.getBody();
            System.out.println(orderStr);
            if (response.isSuccess()) {
                System.out.println("调用成功");
                Map<String, Object> result = new HashMap<>();
                result.put("orderString", response.getBody());
                result.put("outTradeNo", outTradeNo);
                log.info("订单创建成功，商户订单号: {}", outTradeNo);
                return AjaxResult.success("订单创建成功", result);
            } else {
                System.out.println("调用失败");
                log.error("订单创建失败: {}，错误码: {}，子错误码: {}，子错误信息: {}",
                        response.getMsg(), response.getCode(), response.getSubCode(), response.getSubMsg());
                return AjaxResult.error("订单创建失败: " + response.getMsg() +
                        " (错误码: " + response.getCode() +
                        ", 子错误码: " + response.getSubCode() +
                        ", 子错误信息: " + response.getSubMsg() + ")");
                // sdk版本是"4.38.0.ALL"及以上,可以参考下面的示例获取诊断链接
                // String diagnosisUrl = DiagnosisUtils.getDiagnosisUrl(response);
                // System.out.println(diagnosisUrl);
            }
        } catch (Exception e) {
            log.error("创建订单过程中发生未预期的异常", e);
            return AjaxResult.error("创建订单过程中发生未预期的异常: " + e.getMessage());
        }
    }

    /**
     * APP支付接口 - 生成支付订单字符串供APP调用支付宝SDK
     * @param subject 订单标题
     * @param totalAmount 订单总金额
     * @param outTradeNo 商户订单号
     * @param body 订单描述
     * @return 支付订单字符串
     */
    @PostMapping("/appPay")
    public AjaxResult appPay(@RequestParam String subject,
                             @RequestParam String totalAmount,
                             @RequestParam String outTradeNo,
                             @RequestParam(required = false) String body) {
        try {
            log.info("开始处理APP支付请求，订单标题: {}, 总金额: {}, 商户订单号: {}", subject, totalAmount, outTradeNo);
            
            // 实例化客户端
            AlipayClient alipayClient = createAlipayClient();

            // 实例化具体API对应的request类
            AlipayTradeAppPayRequest request = new AlipayTradeAppPayRequest();

            // 设置业务参数
            AlipayTradeAppPayModel model = new AlipayTradeAppPayModel();
            model.setSubject(subject);
            model.setTotalAmount(AlipayConfig.formatAmount(totalAmount));
            model.setOutTradeNo(outTradeNo);
            if (body != null && !body.trim().isEmpty()) {
                model.setBody(body);
            }
            model.setTimeoutExpress("30m");
            model.setProductCode("QUICK_MSECURITY_PAY"); // APP支付产品码固定值

            request.setBizModel(model);
            request.setNotifyUrl(AlipayConfig.NOTIFY_URL);
            
            log.info("准备调用支付宝APP支付API，网关地址: {}, APP_ID: {}", AlipayConfig.getGatewayUrl(), AlipayConfig.APP_ID);

            // 调用SDK生成订单字符串，供APP调用支付宝SDK
            long startTime = System.currentTimeMillis();
            AlipayTradeAppPayResponse response = alipayClient.sdkExecute(request);
            long endTime = System.currentTimeMillis();
            
            log.info("支付宝APP支付API调用完成，耗时: {}ms", (endTime - startTime));
            
            if (response.isSuccess()) {
                Map<String, Object> result = new HashMap<>();
                // 返回orderString供APP调用支付宝SDK
                result.put("orderString", response.getBody());
                result.put("outTradeNo", outTradeNo);
                log.info("APP支付订单生成成功，商户订单号: {}", outTradeNo);
                return AjaxResult.success("支付订单生成成功", result);
            } else {
                log.error("APP支付订单生成失败: {}，错误码: {}，子错误码: {}，子错误信息: {}", 
                         response.getMsg(), response.getCode(), response.getSubCode(), response.getSubMsg());
                return AjaxResult.error("支付订单生成失败: " + response.getMsg() + 
                                      " (错误码: " + response.getCode() + 
                                      ", 子错误码: " + response.getSubCode() + 
                                      ", 子错误信息: " + response.getSubMsg() + ")");
            }
        } catch (AlipayApiException e) {
            log.error("APP支付订单生成异常", e);
            return AjaxResult.error("支付订单生成异常: " + e.getMessage());
        } catch (Exception e) {
            log.error("APP支付订单生成过程中发生未预期的异常", e);
            return AjaxResult.error("支付订单生成过程中发生未预期的异常: " + e.getMessage());
        }
    }

    /**
     * 网页支付接口 - 生成支付表单供网页跳转
     * @param subject 订单标题
     * @param totalAmount 订单总金额
     * @param outTradeNo 商户订单号
     * @param body 订单描述
     * @return 支付表单HTML
     */
    @PostMapping("/webPay")
    public AjaxResult webPay(@RequestParam String subject,
                             @RequestParam String totalAmount,
                             @RequestParam String outTradeNo,
                             @RequestParam(required = false) String body) {
        try {
            log.info("开始处理网页支付请求，订单标题: {}, 总金额: {}, 商户订单号: {}", subject, totalAmount, outTradeNo);
            
            // 实例化客户端
            AlipayClient alipayClient = createAlipayClient();

            // 实例化具体API对应的request类
            AlipayTradePagePayRequest request = new AlipayTradePagePayRequest();
            request.setReturnUrl(AlipayConfig.RETURN_URL); // 同步回调地址
            request.setNotifyUrl(AlipayConfig.NOTIFY_URL); // 异步回调地址

            // 设置业务参数
            AlipayTradePagePayModel model = new AlipayTradePagePayModel();
            model.setSubject(subject);
            model.setTotalAmount(AlipayConfig.formatAmount(totalAmount));
            model.setOutTradeNo(outTradeNo);
            if (body != null && !body.trim().isEmpty()) {
                model.setBody(body);
            }
            model.setTimeoutExpress("30m");
            model.setProductCode("FAST_INSTANT_TRADE_PAY"); // 网页支付产品码固定值

            request.setBizModel(model);
            
            log.info("准备调用支付宝网页支付API，网关地址: {}, APP_ID: {}", AlipayConfig.getGatewayUrl(), AlipayConfig.APP_ID);

            // 调用SDK生成支付表单
            long startTime = System.currentTimeMillis();
            AlipayTradePagePayResponse response = alipayClient.pageExecute(request);
            long endTime = System.currentTimeMillis();
            
            log.info("支付宝网页支付API调用完成，耗时: {}ms", (endTime - startTime));
            
            if (response.isSuccess()) {
                Map<String, Object> result = new HashMap<>();
                // 返回表单HTML供前端跳转
                result.put("form", response.getBody());
                result.put("outTradeNo", outTradeNo);
                log.info("网页支付订单生成成功，商户订单号: {}", outTradeNo);
                return AjaxResult.success("支付订单生成成功", result);
            } else {
                log.error("网页支付订单生成失败: {}，错误码: {}，子错误码: {}，子错误信息: {}", 
                         response.getMsg(), response.getCode(), response.getSubCode(), response.getSubMsg());
                return AjaxResult.error("支付订单生成失败: " + response.getMsg() + 
                                      " (错误码: " + response.getCode() + 
                                      ", 子错误码: " + response.getSubCode() + 
                                      ", 子错误信息: " + response.getSubMsg() + ")");
            }
        } catch (AlipayApiException e) {
            log.error("网页支付订单生成异常", e);
            return AjaxResult.error("支付订单生成异常: " + e.getMessage());
        } catch (Exception e) {
            log.error("网页支付订单生成过程中发生未预期的异常", e);
            return AjaxResult.error("支付订单生成过程中发生未预期的异常: " + e.getMessage());
        }
    }

    /**
     * 关闭交易接口
     * @param outTradeNo 商户订单号
     * @param tradeNo 支付宝交易号
     * @return 关闭结果
     */
    @PostMapping("/closeTrade")
    public AjaxResult closeTrade(@RequestParam(required = false) String outTradeNo,
                                @RequestParam(required = false) String tradeNo) {
        try {
            if ((outTradeNo == null || outTradeNo.trim().isEmpty()) && 
                (tradeNo == null || tradeNo.trim().isEmpty())) {
                return AjaxResult.error("商户订单号和支付宝交易号不能同时为空");
            }

            // 实例化客户端
            AlipayClient alipayClient = createAlipayClient();

            // 实例化具体API对应的request类
            AlipayTradeCloseRequest request = new AlipayTradeCloseRequest();

            // 设置业务参数
            AlipayTradeCloseModel model = new AlipayTradeCloseModel();
            if (outTradeNo != null && !outTradeNo.trim().isEmpty()) {
                model.setOutTradeNo(outTradeNo);
            }
            if (tradeNo != null && !tradeNo.trim().isEmpty()) {
                model.setTradeNo(tradeNo);
            }

            request.setBizModel(model);

            // 调用接口
            AlipayTradeCloseResponse response = alipayClient.execute(request);
            
            if (response.isSuccess()) {
                Map<String, Object> result = new HashMap<>();
                result.put("tradeNo", response.getTradeNo());
                result.put("outTradeNo", response.getOutTradeNo());
                return AjaxResult.success("交易关闭成功", result);
            } else {
                log.error("交易关闭失败: {}", response.getMsg());
                return AjaxResult.error("交易关闭失败: " + response.getMsg());
            }
        } catch (AlipayApiException e) {
            log.error("关闭交易异常", e);
            return AjaxResult.error("关闭交易异常: " + e.getMessage());
        }
    }

    /**
     * 退款接口
     * @param outTradeNo 商户订单号
     * @param tradeNo 支付宝交易号
     * @param refundAmount 退款金额
     * @param refundReason 退款原因
     * @param outRequestNo 退款单号
     * @return 退款结果
     */
    @PostMapping("/refund")
    public AjaxResult refund(@RequestParam(required = false) String outTradeNo,
                            @RequestParam(required = false) String tradeNo,
                            @RequestParam String refundAmount,
                            @RequestParam(required = false) String refundReason,
                            @RequestParam String outRequestNo) {
        try {
            if ((outTradeNo == null || outTradeNo.trim().isEmpty()) && 
                (tradeNo == null || tradeNo.trim().isEmpty())) {
                return AjaxResult.error("商户订单号和支付宝交易号不能同时为空");
            }

            // 实例化客户端
            AlipayClient alipayClient = createAlipayClient();

            // 实例化具体API对应的request类
            AlipayTradeRefundRequest request = new AlipayTradeRefundRequest();

            // 设置业务参数
            AlipayTradeRefundModel model = new AlipayTradeRefundModel();
            if (outTradeNo != null && !outTradeNo.trim().isEmpty()) {
                model.setOutTradeNo(outTradeNo);
            }
            if (tradeNo != null && !tradeNo.trim().isEmpty()) {
                model.setTradeNo(tradeNo);
            }
            model.setRefundAmount(AlipayConfig.formatAmount(refundAmount));
            model.setRefundReason(refundReason);
            model.setOutRequestNo(outRequestNo);

            request.setBizModel(model);

            // 调用接口
            AlipayTradeRefundResponse response = alipayClient.execute(request);
            
            if (response.isSuccess()) {
                Map<String, Object> result = new HashMap<>();
                result.put("tradeNo", response.getTradeNo());
                result.put("outTradeNo", response.getOutTradeNo());
                
                // 安全地获取退款相关字段，使用getParams()方法作为备用
                try {
                    // 尝试直接获取退款费用
                    result.put("refundFee", response.getRefundFee());
                } catch (Exception e) {
                    log.warn("获取退款费用失败，尝试从参数中获取: {}", e.getMessage());
                    if (response.getParams() != null) {
                        result.put("refundFee", response.getParams().get("refund_fee"));
                    }
                }
                
                // 获取退款单号
                try {
                    if (response.getParams() != null && response.getParams().get("out_request_no") != null) {
                        result.put("outRequestNo", response.getParams().get("out_request_no"));
                    } else {
                        result.put("outRequestNo", outRequestNo); // 使用传入的参数
                    }
                } catch (Exception e) {
                    log.warn("获取退款单号失败，使用传入参数: {}", e.getMessage());
                    result.put("outRequestNo", outRequestNo);
                }
                
                return AjaxResult.success("退款成功", result);
            } else {
                log.error("退款失败: {}", response.getMsg());
                return AjaxResult.error("退款失败: " + response.getMsg());
            }
        } catch (AlipayApiException e) {
            log.error("退款异常", e);
            return AjaxResult.error("退款异常: " + e.getMessage());
        }
    }

    /**
     * 查询支付单接口
     * @param outTradeNo 商户订单号
     * @param tradeNo 支付宝交易号
     * @return 支付单信息
     */
    @GetMapping("/queryPayment")
    public AjaxResult queryPayment(@RequestParam(required = false) String outTradeNo,
                                  @RequestParam(required = false) String tradeNo) {
        try {
            if ((outTradeNo == null || outTradeNo.trim().isEmpty()) && 
                (tradeNo == null || tradeNo.trim().isEmpty())) {
                return AjaxResult.error("商户订单号和支付宝交易号不能同时为空");
            }

            // 实例化客户端
            AlipayClient alipayClient = createAlipayClient();

            // 实例化具体API对应的request类
            AlipayTradeQueryRequest request = new AlipayTradeQueryRequest();

            // 设置业务参数
            AlipayTradeQueryModel model = new AlipayTradeQueryModel();
            if (outTradeNo != null && !outTradeNo.trim().isEmpty()) {
                model.setOutTradeNo(outTradeNo);
            }
            if (tradeNo != null && !tradeNo.trim().isEmpty()) {
                model.setTradeNo(tradeNo);
            }

            request.setBizModel(model);

            // 调用接口
            AlipayTradeQueryResponse response = alipayClient.execute(request);
            
            if (response.isSuccess()) {
                Map<String, Object> result = new HashMap<>();
                result.put("tradeNo", response.getTradeNo());
                result.put("outTradeNo", response.getOutTradeNo());
                result.put("tradeStatus", response.getTradeStatus());
                result.put("totalAmount", response.getTotalAmount());
                result.put("receiptAmount", response.getReceiptAmount());
                result.put("buyerPayAmount", response.getBuyerPayAmount());
                result.put("subject", response.getSubject());
                result.put("body", response.getBody());
                // 注意：gmtPayment和gmtCreate方法可能在某些SDK版本中不存在
                // 如果需要这些字段，可以通过getParams()方法获取
                try {
                    if (response.getParams() != null) {
                        result.put("gmtPayment", response.getParams().get("gmt_payment"));
                        result.put("gmtCreate", response.getParams().get("gmt_create"));
                    }
                } catch (Exception e) {
                    log.warn("获取时间字段失败: {}", e.getMessage());
                }
                return AjaxResult.success("查询成功", result);
            } else {
                log.error("查询支付单失败: {}", response.getMsg());
                return AjaxResult.error("查询支付单失败: " + response.getMsg());
            }
        } catch (AlipayApiException e) {
            log.error("查询支付单异常", e);
            return AjaxResult.error("查询支付单异常: " + e.getMessage());
        }
    }

    /**
     * 查询退款单接口
     * @param outTradeNo 商户订单号
     * @param tradeNo 支付宝交易号
     * @param outRequestNo 退款单号
     * @return 退款单信息
     */
    @GetMapping("/queryRefund")
    public AjaxResult queryRefund(@RequestParam(required = false) String outTradeNo,
                                 @RequestParam(required = false) String tradeNo,
                                 @RequestParam String outRequestNo) {
        try {
            // 验证必填参数
            if (outRequestNo == null || outRequestNo.trim().isEmpty()) {
                return AjaxResult.error("退款单号不能为空");
            }
            
            if ((outTradeNo == null || outTradeNo.trim().isEmpty()) && 
                (tradeNo == null || tradeNo.trim().isEmpty())) {
                return AjaxResult.error("商户订单号和支付宝交易号不能同时为空");
            }

            // 实例化客户端
            AlipayClient alipayClient = createAlipayClient();

            // 实例化具体API对应的request类
            AlipayTradeFastpayRefundQueryRequest request = new AlipayTradeFastpayRefundQueryRequest();

            // 设置业务参数
            AlipayTradeFastpayRefundQueryModel model = new AlipayTradeFastpayRefundQueryModel();
            if (outTradeNo != null && !outTradeNo.trim().isEmpty()) {
                model.setOutTradeNo(outTradeNo);
            }
            if (tradeNo != null && !tradeNo.trim().isEmpty()) {
                model.setTradeNo(tradeNo);
            }
            model.setOutRequestNo(outRequestNo);

            request.setBizModel(model);

            // 调用接口
            AlipayTradeFastpayRefundQueryResponse response = alipayClient.execute(request);
            
            if (response.isSuccess()) {
                Map<String, Object> result = new HashMap<>();
                result.put("tradeNo", response.getTradeNo());
                result.put("outTradeNo", response.getOutTradeNo());
                
                // 安全地获取退款单号
                try {
                    if (response.getParams() != null && response.getParams().get("out_request_no") != null) {
                        result.put("outRequestNo", response.getParams().get("out_request_no"));
                    } else {
                        result.put("outRequestNo", outRequestNo); // 使用传入的参数
                    }
                } catch (Exception e) {
                    log.warn("获取退款单号失败，使用传入参数: {}", e.getMessage());
                    result.put("outRequestNo", outRequestNo);
                }
                
                // 安全地获取其他退款相关字段
                try {
                    result.put("refundReason", response.getRefundReason());
                } catch (Exception e) {
                    log.warn("获取退款原因失败: {}", e.getMessage());
                    if (response.getParams() != null) {
                        result.put("refundReason", response.getParams().get("refund_reason"));
                    }
                }
                
                try {
                    result.put("totalAmount", response.getTotalAmount());
                } catch (Exception e) {
                    log.warn("获取总金额失败: {}", e.getMessage());
                    if (response.getParams() != null) {
                        result.put("totalAmount", response.getParams().get("total_amount"));
                    }
                }
                
                try {
                    result.put("refundAmount", response.getRefundAmount());
                } catch (Exception e) {
                    log.warn("获取退款金额失败: {}", e.getMessage());
                    if (response.getParams() != null) {
                        result.put("refundAmount", response.getParams().get("refund_amount"));
                    }
                }
                
                try {
                    result.put("refundStatus", response.getRefundStatus());
                } catch (Exception e) {
                    log.warn("获取退款状态失败: {}", e.getMessage());
                    if (response.getParams() != null) {
                        result.put("refundStatus", response.getParams().get("refund_status"));
                    }
                }
                
                // 获取退款时间
                try {
                    if (response.getParams() != null) {
                        result.put("gmtRefundPay", response.getParams().get("gmt_refund_pay"));
                    }
                } catch (Exception e) {
                    log.warn("获取退款时间失败: {}", e.getMessage());
                }
                
                return AjaxResult.success("查询退款单成功", result);
            } else {
                log.error("查询退款单失败: {}", response.getMsg());
                return AjaxResult.error("查询退款单失败: " + response.getMsg());
            }
        } catch (AlipayApiException e) {
            log.error("查询退款单异常", e);
            return AjaxResult.error("查询退款单异常: " + e.getMessage());
        }
    }

    /**
     * 支付宝异步通知接口
     * @param request HTTP请求
     * @return 处理结果
     */
    @PostMapping("/notify")
    public String notify(HttpServletRequest request) {
        try {
            // 获取支付宝POST过来反馈信息
            Map<String, String> params = new HashMap<>();
            Map<String, String[]> requestParams = request.getParameterMap();
            for (Iterator<String> iter = requestParams.keySet().iterator(); iter.hasNext();) {
                String name = iter.next();
                String[] values = requestParams.get(name);
                String valueStr = "";
                for (int i = 0; i < values.length; i++) {
                    valueStr = (i == values.length - 1) ? valueStr + values[i] : valueStr + values[i] + ",";
                }
                // 乱码解决，这段代码在出现乱码时使用
                try {
                    valueStr = new String(valueStr.getBytes("ISO-8859-1"), "utf-8");
                } catch (UnsupportedEncodingException e) {
                    log.error("字符编码转换异常", e);
                }
                params.put(name, valueStr);
            }

            // 调用SDK验证签名
            boolean signVerified = AlipaySignature.rsaCheckV1(params, AlipayConfig.ALIPAY_PUBLIC_KEY, AlipayConfig.CHARSET, AlipayConfig.SIGN_TYPE);

            if (signVerified) {
                // 验证成功
                String tradeStatus = params.get("trade_status");
                String outTradeNo = params.get("out_trade_no");
                String tradeNo = params.get("trade_no");
                String totalAmount = params.get("total_amount");

                log.info("支付宝异步通知验证成功 - 订单号: {}, 交易号: {}, 交易状态: {}, 交易金额: {}", 
                        outTradeNo, tradeNo, tradeStatus, totalAmount);

                // 根据不同的交易状态进行相应的业务处理
                if ("TRADE_SUCCESS".equals(tradeStatus) || "TRADE_FINISHED".equals(tradeStatus)) {
                    // TODO: 在这里处理支付成功的业务逻辑
                    log.info("支付成功，处理业务逻辑 - 订单号: {}", outTradeNo);
                }

                return "success";
            } else {
                // 验证失败
                log.error("支付宝异步通知验证失败");
                return "failure";
            }
        } catch (AlipayApiException e) {
            log.error("处理支付宝异步通知异常", e);
            return "failure";
        }
    }

    /**
     * 支付宝同步通知接口
     * @param request HTTP请求
     * @return 处理结果
     */
    @GetMapping("/return")
    public AjaxResult returnUrl(HttpServletRequest request) {
        try {
            System.out.println("return_url");
            // 获取支付宝GET过来反馈信息
            Map<String, String> params = new HashMap<>();
            Map<String, String[]> requestParams = request.getParameterMap();
            for (Iterator<String> iter = requestParams.keySet().iterator(); iter.hasNext();) {
                String name = iter.next();
                String[] values = requestParams.get(name);
                String valueStr = "";
                for (int i = 0; i < values.length; i++) {
                    valueStr = (i == values.length - 1) ? valueStr + values[i] : valueStr + values[i] + ",";
                }
                // 乱码解决，这段代码在出现乱码时使用
                try {
                    valueStr = new String(valueStr.getBytes("ISO-8859-1"), "utf-8");
                } catch (UnsupportedEncodingException e) {
                    log.error("字符编码转换异常", e);
                }
                params.put(name, valueStr);
            }

            // 调用SDK验证签名
            boolean signVerified = AlipaySignature.rsaCheckV1(params, AlipayConfig.ALIPAY_PUBLIC_KEY, AlipayConfig.CHARSET, AlipayConfig.SIGN_TYPE);

            if (signVerified) {
                String outTradeNo = params.get("out_trade_no");
                String tradeNo = params.get("trade_no");
                String totalAmount = params.get("total_amount");

                log.info("支付宝同步通知验证成功 - 订单号: {}, 交易号: {}, 交易金额: {}", 
                        outTradeNo, tradeNo, totalAmount);

                Map<String, Object> result = new HashMap<>();
                result.put("outTradeNo", outTradeNo);
                result.put("tradeNo", tradeNo);
                result.put("totalAmount", totalAmount);
                result.put("message", "支付成功");

                return AjaxResult.success("支付成功", result);
            } else {
                log.error("支付宝同步通知验证失败");
                return AjaxResult.error("支付验证失败");
            }
        } catch (AlipayApiException e) {
            log.error("处理支付宝同步通知异常", e);
            return AjaxResult.error("处理支付结果异常");
        }
    }

    /**
     * 创建支付宝客户端实例
     * @return AlipayClient实例
     */
    private AlipayClient createAlipayClient() {
        // 使用默认构造函数创建客户端
        AlipayClient client = new DefaultAlipayClient(
            AlipayConfig.getGatewayUrl(),
            AlipayConfig.APP_ID,
            AlipayConfig.PRIVATE_KEY,
            "json",
            AlipayConfig.CHARSET,
            AlipayConfig.ALIPAY_PUBLIC_KEY,
            AlipayConfig.SIGN_TYPE);
        
        // 尝试通过反射设置超时参数
        try {
            // 尝试设置连接超时
            try {
                java.lang.reflect.Method setConnectTimeoutMethod = client.getClass().getMethod("setConnectTimeout", int.class);
                setConnectTimeoutMethod.invoke(client, 15000); // 15秒连接超时
                log.info("通过setter方法设置连接超时: 15秒");
            } catch (Exception e) {
                // 如果没有setter方法，尝试通过字段设置
                java.lang.reflect.Field connectTimeoutField = client.getClass().getDeclaredField("connectTimeout");
                connectTimeoutField.setAccessible(true);
                connectTimeoutField.set(client, 15000); // 15秒连接超时
                log.info("通过反射字段设置连接超时: 15秒");
            }
            
            // 尝试设置读取超时
            try {
                java.lang.reflect.Method setReadTimeoutMethod = client.getClass().getMethod("setReadTimeout", int.class);
                setReadTimeoutMethod.invoke(client, 60000); // 60秒读取超时
                log.info("通过setter方法设置读取超时: 60秒");
            } catch (Exception e) {
                // 如果没有setter方法，尝试通过字段设置
                java.lang.reflect.Field readTimeoutField = client.getClass().getDeclaredField("readTimeout");
                readTimeoutField.setAccessible(true);
                readTimeoutField.set(client, 60000); // 60秒读取超时
                log.info("通过反射字段设置读取超时: 60秒");
            }
        } catch (Exception e) {
            log.warn("无法设置支付宝客户端超时参数，使用默认超时设置", e);
        }
        
        return client;
    }
}
