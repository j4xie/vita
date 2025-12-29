package com.ruoyi.web.controller.system.app;

import com.alipay.api.response.AlipayTradeAppPayResponse;
import com.ruoyi.common.annotation.Log;
import com.ruoyi.common.core.controller.BaseController;
import com.ruoyi.common.core.domain.AjaxResult;
import com.ruoyi.common.core.page.TableDataInfo;
import com.ruoyi.common.enums.BusinessType;
import com.ruoyi.common.utils.CommonUtils;
import com.ruoyi.common.utils.poi.ExcelUtil;
import com.ruoyi.system.domain.*;
import com.ruoyi.system.pay.AlipayUtils;
import com.ruoyi.system.service.*;
import org.aspectj.weaver.loadtime.Aj;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.transaction.interceptor.TransactionAspectSupport;
import org.springframework.web.bind.annotation.*;

import javax.servlet.http.HttpServletResponse;
import java.math.BigDecimal;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

/**
 * 用户端订单Controller
 * 
 * @author ruoyi
 * @date 2025-09-28
 */
@RestController
@RequestMapping("/app/order")
public class AppOrderController extends BaseController
{
    private static final Logger log = LoggerFactory.getLogger(AppOrderController.class);

    @Autowired
    private ISysOrderService sysOrderService;

    @Autowired
    private IUserExtendsDataService userExtendsDataService;

    @Autowired
    private IMallPointGoodsService  mallPointGoodsService;

    @Autowired
    private IActivityExUserService activityExUserService;

    @Autowired
    private IActivityService activityService;

    /**
     * 查询订单列表
     */
    @PreAuthorize("@ss.hasPermi('system:role:client')")
    @GetMapping("/list")
    public TableDataInfo list(SysOrder sysOrder)
    {
        sysOrder.setCreateById(getUserId());
        startPage();
        List<SysOrder> list = sysOrderService.selectSysOrderList(sysOrder);
        for(int i = 0;i <  list.size();i++){
            list.get(i).setOrderStatusText(CommonUtils.checkOrderStatus(list.get(i).getOrderStatus()));
            list.get(i).setOrderTypeText(CommonUtils.checkOrderType(list.get(i).getOrderType()));
            list.get(i).setPayModeText(CommonUtils.checkPayMode(list.get(i).getPayMode()));
        }
        return getDataTable(list);
    }

    /**
     * 订单详情
     * @param orderId
     * @return
     */
    @PreAuthorize("@ss.hasPermi('system:role:client')")
    @PostMapping(value = "/info")
    public AjaxResult getInfo(Long orderId)
    {
        return success(sysOrderService.selectSysOrderById(orderId));
    }

    /**
     * 创建订单
     */
    @PreAuthorize("@ss.hasPermi('system:role:client')")
    @Transactional(rollbackFor = Exception.class)
    @Log(title = "用户端创建订单", businessType = BusinessType.INSERT)
    @PostMapping("/createOrder")
    public AjaxResult add(SysOrder sysOrder)
    {
        try{
            int count = 0;
            BigDecimal totalPointPrice = null;

            if(null != sysOrder){
                if(sysOrder.getOrderType() == 1){//如果是积分兑换，需要判断用户积分是否够兑换
                    //查询当前用户积分
                    UserExtendsData userExtendsData = userExtendsDataService.selectUserExtendsDataByUserId(getUserId());
                    if(null == userExtendsData){
                        AjaxResult ajaxResult = AjaxResult.error();
                        ajaxResult.put("msg", "没有足够积分");
                        return ajaxResult;
                    }
                    totalPointPrice = sysOrder.getPrice().multiply(new BigDecimal(sysOrder.getNum()));
                    if (totalPointPrice.compareTo(userExtendsData.getUserPoint()) > 0) {
                        AjaxResult ajaxResult = AjaxResult.error();
                        ajaxResult.put("msg", "没有足够积分");
                        return ajaxResult;
                    }
                }else if(sysOrder.getOrderType() == 2){
                    //判断活动名额是否已满
                    Activity activity = activityService.selectActivityById(sysOrder.getActivityId());
                    ActivityExUser activityExUser = new ActivityExUser();
                    activityExUser.setActivityId(sysOrder.getActivityId());
                    List<ActivityExUser> listVO = activityExUserService.selectActivityExUserList(activityExUser);
                    if(!listVO.isEmpty() && listVO.size() > 0){
                        if(listVO.size() >= activity.getEnrollment() && 0 != activity.getEnrollment()){
                            AjaxResult ajaxResult = AjaxResult.error();
                            ajaxResult.put("msg", "报名失败：活动人数已满");
                            return ajaxResult;
                        }
                    }
                    sysOrder.setTitle("参与活动："+activity.getName());
                    sysOrder.setOrderStatus(1L);
                    sysOrder.setOrderDesc("参与活动："+activity.getName());
                }else if(sysOrder.getOrderType() == 3){
                    sysOrder.setTitle("获取红卡会员等级");
                    sysOrder.setOrderStatus(1L);
                    sysOrder.setOrderDesc("获取红卡会员等级");
                }
                sysOrder.setCreateById(getUserId());
                sysOrder.setCreateByName(getLoginUser().getUser().getLegalName());
            }

            count = sysOrderService.insertSysOrder(sysOrder);
            if(count > 0){//创建订单成功，金额支付的调用支付接口
                if(sysOrder.getOrderType() == 1){
                    //积分兑换
                    //扣除积分
                    UserExtendsData userExtendsData = userExtendsDataService.selectUserExtendsDataByUserId(getUserId());
                    userExtendsData.setUserPoint(userExtendsData.getUserPoint().subtract(totalPointPrice));
                    userExtendsDataService.updateUserExtendsData(userExtendsData);

                    //减商品库存
                    MallPointGoods mallPointGoods = mallPointGoodsService.selectMallPointGoodsById(sysOrder.getGoodsId());
                    MallPointGoods mallPointGoodsDTO= new MallPointGoods();
                    mallPointGoodsDTO.setId(sysOrder.getGoodsId());
                    mallPointGoodsDTO.setQuantity(mallPointGoods.getQuantity() - sysOrder.getNum());
                    mallPointGoodsService.updateMallPointGoods(mallPointGoodsDTO);
                }else if(sysOrder.getOrderType() == 2){
                    //创建一个待付款的活动报名单
                    ActivityExUser activityExUser = new ActivityExUser();
                    activityExUser.setActivityId(sysOrder.getActivityId());
                    activityExUser.setUserId(getUserId());
                    activityExUser.setSignStatus(-1L);
                    activityExUser.setStatus(-1L);
                    activityExUserService.insertActivityExUser(activityExUser);
                    if(sysOrder.getPayChannel() == 1){
                        //支付宝支付
                        try {
                            AlipayTradeAppPayResponse response = AlipayUtils.getInstance().appPay(sysOrder.getTitle(), sysOrder.getPrice().toString(), sysOrder.getOrderNo());
                            String orderStr = response.getBody();
                            System.out.println(orderStr);
                            if (response.isSuccess()) {
                                System.out.println("调用成功");
                                Map<String, Object> result = new HashMap<>();
                                result.put("orderString", response.getBody());
                                result.put("outTradeNo", sysOrder.getOrderNo());
                                log.info("订单创建成功，商户订单号: {}", sysOrder.getOrderNo());

                                SysOrder sysOrderDTO = new SysOrder();
                                sysOrderDTO.setId(sysOrder.getId());
                                sysOrderDTO.setOrderStr(response.getBody());
                                sysOrderService.updateSysOrder(sysOrderDTO);

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
                }else if(sysOrder.getOrderType() == 3){
                    //购买会员等级
                    if(sysOrder.getPayChannel() == 1){
                        //支付宝支付
                        try {
                            AlipayTradeAppPayResponse response = AlipayUtils.getInstance().appPay(sysOrder.getTitle(), sysOrder.getPrice().toString(), sysOrder.getOrderNo());
                            String orderStr = response.getBody();
                            System.out.println(orderStr);
                            if (response.isSuccess()) {
                                System.out.println("调用成功");
                                Map<String, Object> result = new HashMap<>();
                                result.put("orderString", response.getBody());
                                result.put("outTradeNo", sysOrder.getOrderNo());
                                log.info("订单创建成功，商户订单号: {}", sysOrder.getOrderNo());

                                SysOrder sysOrderDTO = new SysOrder();
                                sysOrderDTO.setId(sysOrder.getId());
                                sysOrderDTO.setOrderStr(response.getBody());
                                sysOrderService.updateSysOrder(sysOrderDTO);

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
                }
            }
            return toAjax(count);
        } catch (Exception e) {
            //强制事务回滚
            TransactionAspectSupport.currentTransactionStatus().setRollbackOnly();
            AjaxResult ajaxResult = AjaxResult.error();
            ajaxResult.put("msg", "报名失败");
            return ajaxResult;
        }
    }

    /**
     * 取消订单
     */
    @PreAuthorize("@ss.hasPermi('system:role:client')")
    @Log(title = "用户取消订单", businessType = BusinessType.UPDATE)
    @PostMapping("/cancelOrder")
    public AjaxResult cancelOrder(Long orderId, String cancelReason)
    {
        int count = sysOrderService.cancelOrder(orderId, cancelReason);
        if(count == -2){
            AjaxResult ajaxResult = AjaxResult.error();
            ajaxResult.put("msg", "当前订单状态无法取消");
            return ajaxResult;
        }
        return toAjax(count);
    }

    /**
     * 订单确认收货
     * @param orderId
     * @return
     */
    @PreAuthorize("@ss.hasPermi('system:role:client')")
    @Log(title = "订单确认收货", businessType = BusinessType.UPDATE)
    @PostMapping("/confirmReceipt")
    public AjaxResult confirmReceipt(Long orderId)
    {
        SysOrder sysOrder = sysOrderService.selectSysOrderById(orderId);
        if(null != sysOrder && sysOrder.getOrderStatus() != 6){
            AjaxResult ajaxResult = AjaxResult.error();
            ajaxResult.put("msg", "当前订单无需此操作");
            return ajaxResult;
        }

        SysOrder sysOrderVo = new SysOrder();
        sysOrderVo.setId(orderId);
        sysOrderVo.setOrderStatus(2L);
        return toAjax(sysOrderService.updateSysOrder(sysOrderVo));
    }

}
