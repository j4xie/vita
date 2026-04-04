/*
 * Decompiled with CFR 0.152.
 * 
 * Could not load the following classes:
 *  com.ruoyi.common.annotation.Log
 *  com.ruoyi.common.core.controller.BaseController
 *  com.ruoyi.common.core.domain.AjaxResult
 *  com.ruoyi.common.core.page.TableDataInfo
 *  com.ruoyi.common.enums.BusinessType
 *  com.ruoyi.common.utils.CommonUtils
 *  com.ruoyi.system.domain.SysOrder
 *  com.ruoyi.system.service.IActivityExUserService
 *  com.ruoyi.system.service.IActivityService
 *  com.ruoyi.system.service.IMallPointGoodsService
 *  com.ruoyi.system.service.ISysOrderService
 *  com.ruoyi.system.service.IUserExtendsDataLogService
 *  com.ruoyi.system.service.IUserExtendsDataService
 *  com.ruoyi.system.service.StripeService
 *  org.apache.http.util.TextUtils
 *  org.slf4j.Logger
 *  org.slf4j.LoggerFactory
 *  org.springframework.beans.factory.annotation.Autowired
 *  org.springframework.security.access.prepost.PreAuthorize
 *  org.springframework.transaction.annotation.Transactional
 *  org.springframework.transaction.interceptor.TransactionAspectSupport
 *  org.springframework.web.bind.annotation.GetMapping
 *  org.springframework.web.bind.annotation.PostMapping
 *  org.springframework.web.bind.annotation.RequestMapping
 *  org.springframework.web.bind.annotation.RestController
 */
package com.ruoyi.web.controller.system.app;

import com.ruoyi.common.annotation.Log;
import com.ruoyi.common.core.controller.BaseController;
import com.ruoyi.common.core.domain.AjaxResult;
import com.ruoyi.common.core.page.TableDataInfo;
import com.ruoyi.common.enums.BusinessType;
import com.ruoyi.common.utils.CommonUtils;
import com.ruoyi.system.domain.SysOrder;
import com.ruoyi.system.service.IActivityExUserService;
import com.ruoyi.system.service.IActivityService;
import com.ruoyi.system.service.IMallPointGoodsService;
import com.ruoyi.system.service.ISysOrderService;
import com.ruoyi.system.service.IUserExtendsDataLogService;
import com.ruoyi.system.service.IUserExtendsDataService;
import com.ruoyi.system.service.StripeService;
import java.util.List;
import org.apache.http.util.TextUtils;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.transaction.interceptor.TransactionAspectSupport;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping(value={"/app/order"})
public class AppOrderController
extends BaseController {
    private static final Logger log = LoggerFactory.getLogger(AppOrderController.class);
    @Autowired
    private ISysOrderService sysOrderService;
    @Autowired
    private IUserExtendsDataService userExtendsDataService;
    @Autowired
    private IMallPointGoodsService mallPointGoodsService;
    @Autowired
    private IActivityExUserService activityExUserService;
    @Autowired
    private IActivityService activityService;
    @Autowired
    private StripeService stripeService;
    @Autowired
    private IUserExtendsDataLogService iUserExtendsDataLogService;

    @PreAuthorize(value="@ss.hasPermi('system:role:client')")
    @GetMapping(value={"/list"})
    public TableDataInfo list(SysOrder sysOrder) {
        sysOrder.setCreateById(this.getUserId());
        this.startPage();
        List list = this.sysOrderService.selectSysOrderList(sysOrder);
        for (int i = 0; i < list.size(); ++i) {
            ((SysOrder)list.get(i)).setOrderStatusText(CommonUtils.checkOrderStatus((Long)((SysOrder)list.get(i)).getOrderStatus()));
            ((SysOrder)list.get(i)).setOrderTypeText(CommonUtils.checkOrderType((Long)((SysOrder)list.get(i)).getOrderType()));
            ((SysOrder)list.get(i)).setPayModeText(CommonUtils.checkPayMode((Long)((SysOrder)list.get(i)).getPayMode()));
        }
        return this.getDataTable(list);
    }

    @PreAuthorize(value="@ss.hasPermi('system:role:client')")
    @PostMapping(value={"/info"})
    public AjaxResult getInfo(Long orderId) {
        return this.success(this.sysOrderService.selectSysOrderById(orderId));
    }

    /*
     * Exception decompiling
     */
    @PreAuthorize(value="@ss.hasPermi('system:role:client')")
    @Transactional(rollbackFor={Exception.class})
    @Log(title="\u7528\u6237\u7aef\u521b\u5efa\u8ba2\u5355", businessType=BusinessType.INSERT)
    @PostMapping(value={"/createOrder"})
    public AjaxResult add(SysOrder sysOrder) {
        /*
         * This method has failed to decompile.  When submitting a bug report, please provide this stack trace, and (if you hold appropriate legal rights) the relevant class file.
         * 
         * org.benf.cfr.reader.util.ConfusedCFRException: Tried to end blocks [10[CATCHBLOCK]], but top level block is 2[TRYBLOCK]
         *     at org.benf.cfr.reader.bytecode.analysis.opgraph.Op04StructuredStatement.processEndingBlocks(Op04StructuredStatement.java:435)
         *     at org.benf.cfr.reader.bytecode.analysis.opgraph.Op04StructuredStatement.buildNestedBlocks(Op04StructuredStatement.java:484)
         *     at org.benf.cfr.reader.bytecode.analysis.opgraph.Op03SimpleStatement.createInitialStructuredBlock(Op03SimpleStatement.java:736)
         *     at org.benf.cfr.reader.bytecode.CodeAnalyser.getAnalysisInner(CodeAnalyser.java:850)
         *     at org.benf.cfr.reader.bytecode.CodeAnalyser.getAnalysisOrWrapFail(CodeAnalyser.java:278)
         *     at org.benf.cfr.reader.bytecode.CodeAnalyser.getAnalysis(CodeAnalyser.java:201)
         *     at org.benf.cfr.reader.entities.attributes.AttributeCode.analyse(AttributeCode.java:94)
         *     at org.benf.cfr.reader.entities.Method.analyse(Method.java:531)
         *     at org.benf.cfr.reader.entities.ClassFile.analyseMid(ClassFile.java:1055)
         *     at org.benf.cfr.reader.entities.ClassFile.analyseTop(ClassFile.java:942)
         *     at org.benf.cfr.reader.Driver.doClass(Driver.java:84)
         *     at org.benf.cfr.reader.CfrDriverImpl.analyse(CfrDriverImpl.java:78)
         *     at org.benf.cfr.reader.Main.main(Main.java:54)
         */
        throw new IllegalStateException("Decompilation failed");
    }

    @PreAuthorize(value="@ss.hasPermi('system:role:client')")
    @Transactional(rollbackFor={Exception.class})
    @PostMapping(value={"/notifyUrl"})
    public AjaxResult notifyUrl(SysOrder sysOrder) {
        try {
            int count = 0;
            if (null == sysOrder || TextUtils.isEmpty((CharSequence)sysOrder.getOrderNo())) {
                AjaxResult ajaxResult = AjaxResult.error();
                ajaxResult.put("msg", (Object)"\u56de\u8c03\u53c2\u6570\u7f3a\u5931");
                return ajaxResult;
            }
            SysOrder sysOrderDTO = this.sysOrderService.selectSysOrderByOrderNo(sysOrder.getOrderNo());
            if (null == sysOrderDTO) {
                AjaxResult ajaxResult = AjaxResult.error();
                ajaxResult.put("msg", (Object)"\u8ba2\u5355\u4e0d\u5b58\u5728");
                return ajaxResult;
            }
            return this.toAjax(count);
        }
        catch (Exception e) {
            TransactionAspectSupport.currentTransactionStatus().setRollbackOnly();
            AjaxResult ajaxResult = AjaxResult.error();
            ajaxResult.put("msg", (Object)"\u62a5\u540d\u5931\u8d25");
            return ajaxResult;
        }
    }

    @PreAuthorize(value="@ss.hasPermi('system:role:client')")
    @Log(title="\u7528\u6237\u53d6\u6d88\u8ba2\u5355", businessType=BusinessType.UPDATE)
    @PostMapping(value={"/cancelOrder"})
    public AjaxResult cancelOrder(Long orderId, String cancelReason) {
        int count = this.sysOrderService.cancelOrder(orderId, cancelReason);
        if (count == -2) {
            AjaxResult ajaxResult = AjaxResult.error();
            ajaxResult.put("msg", (Object)"\u5f53\u524d\u8ba2\u5355\u72b6\u6001\u65e0\u6cd5\u53d6\u6d88");
            return ajaxResult;
        }
        return this.toAjax(count);
    }

    @PreAuthorize(value="@ss.hasPermi('system:role:client')")
    @Log(title="\u8ba2\u5355\u786e\u8ba4\u6536\u8d27", businessType=BusinessType.UPDATE)
    @PostMapping(value={"/confirmReceipt"})
    public AjaxResult confirmReceipt(Long orderId) {
        SysOrder sysOrder = this.sysOrderService.selectSysOrderById(orderId);
        if (null != sysOrder && sysOrder.getOrderStatus() != 6L) {
            AjaxResult ajaxResult = AjaxResult.error();
            ajaxResult.put("msg", (Object)"\u5f53\u524d\u8ba2\u5355\u65e0\u9700\u6b64\u64cd\u4f5c");
            return ajaxResult;
        }
        SysOrder sysOrderVo = new SysOrder();
        sysOrderVo.setId(orderId);
        sysOrderVo.setOrderStatus(Long.valueOf(2L));
        return this.toAjax(this.sysOrderService.updateSysOrder(sysOrderVo));
    }
}
