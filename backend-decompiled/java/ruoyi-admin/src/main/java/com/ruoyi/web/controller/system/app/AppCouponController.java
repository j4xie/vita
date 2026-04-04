/*
 * Decompiled with CFR 0.152.
 * 
 * Could not load the following classes:
 *  com.ruoyi.common.annotation.Log
 *  com.ruoyi.common.core.controller.BaseController
 *  com.ruoyi.common.core.domain.AjaxResult
 *  com.ruoyi.common.core.domain.entity.UserExtendsDataLog
 *  com.ruoyi.common.core.page.TableDataInfo
 *  com.ruoyi.common.enums.BusinessType
 *  com.ruoyi.common.enums.UserCouponStatus
 *  com.ruoyi.system.domain.CouponVerifyLog
 *  com.ruoyi.system.domain.PlateformData
 *  com.ruoyi.system.domain.SysUserExCoupon
 *  com.ruoyi.system.domain.UserExMerchant
 *  com.ruoyi.system.domain.UserExtendsData
 *  com.ruoyi.system.service.ICouponVerifyLogService
 *  com.ruoyi.system.service.IPlateformDataService
 *  com.ruoyi.system.service.ISysCouponService
 *  com.ruoyi.system.service.ISysUserExCouponService
 *  com.ruoyi.system.service.ISysUserExLevelService
 *  com.ruoyi.system.service.ISysUserService
 *  com.ruoyi.system.service.IUserExMerchantService
 *  com.ruoyi.system.service.IUserExtendsDataLogService
 *  com.ruoyi.system.service.IUserExtendsDataService
 *  org.apache.http.util.TextUtils
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
import com.ruoyi.common.core.domain.entity.UserExtendsDataLog;
import com.ruoyi.common.core.page.TableDataInfo;
import com.ruoyi.common.enums.BusinessType;
import com.ruoyi.common.enums.UserCouponStatus;
import com.ruoyi.system.domain.CouponVerifyLog;
import com.ruoyi.system.domain.PlateformData;
import com.ruoyi.system.domain.SysUserExCoupon;
import com.ruoyi.system.domain.UserExMerchant;
import com.ruoyi.system.domain.UserExtendsData;
import com.ruoyi.system.service.ICouponVerifyLogService;
import com.ruoyi.system.service.IPlateformDataService;
import com.ruoyi.system.service.ISysCouponService;
import com.ruoyi.system.service.ISysUserExCouponService;
import com.ruoyi.system.service.ISysUserExLevelService;
import com.ruoyi.system.service.ISysUserService;
import com.ruoyi.system.service.IUserExMerchantService;
import com.ruoyi.system.service.IUserExtendsDataLogService;
import com.ruoyi.system.service.IUserExtendsDataService;
import java.math.BigDecimal;
import java.util.List;
import org.apache.http.util.TextUtils;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.transaction.interceptor.TransactionAspectSupport;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping(value={"/app/coupon"})
public class AppCouponController
extends BaseController {
    @Autowired
    private ISysCouponService sysCouponService;
    @Autowired
    IUserExMerchantService userExMerchantService;
    @Autowired
    private ISysUserExCouponService sysUserExCouponService;
    @Autowired
    private IUserExtendsDataService userExtendsDataService;
    @Autowired
    private ISysUserExLevelService sysUserExLevelService;
    @Autowired
    ISysUserService sysUserService;
    @Autowired
    IPlateformDataService plateformDataService;
    @Autowired
    ICouponVerifyLogService couponVerifyLogService;
    @Autowired
    IUserExMerchantService iUserExMerchantService;
    @Autowired
    private IUserExtendsDataLogService iUserExtendsDataLogService;

    @PreAuthorize(value="@ss.hasPermi('system:role:client')")
    @GetMapping(value={"/userCouponlist"})
    public TableDataInfo list(SysUserExCoupon sysUserExCoupon) {
        sysUserExCoupon.setUserId(this.getUserId());
        this.startPage();
        List list = this.sysUserExCouponService.selectSysUserExCouponList(sysUserExCoupon);
        return this.getDataTable(list);
    }

    @Transactional(rollbackFor={Exception.class})
    @Log(title="\u7528\u6237\u7aef\u6838\u9500\u5238", businessType=BusinessType.UPDATE)
    @PostMapping(value={"/writeOff"})
    public AjaxResult writeOff(SysUserExCoupon sysUserExCoupon) {
        try {
            AjaxResult ajaxResult;
            if (TextUtils.isEmpty((CharSequence)sysUserExCoupon.getCouponNo())) {
                AjaxResult ajaxResult2 = AjaxResult.error();
                ajaxResult2.put("msg", (Object)"\u8bf7\u8f93\u5165\u4f18\u60e0\u5238\u7801");
                return ajaxResult2;
            }
            SysUserExCoupon sysUserExCouponDTO = this.sysUserExCouponService.selectSysUserExCouponByNo(sysUserExCoupon.getCouponNo());
            if (null == sysUserExCouponDTO) {
                AjaxResult ajaxResult3 = AjaxResult.error();
                ajaxResult3.put("msg", (Object)"\u5238\u7801\u4e0d\u5b58\u5728");
                return ajaxResult3;
            }
            if (sysUserExCouponDTO.getPurpose() == 2L) {
                String[] userIds = sysUserExCouponDTO.getPurposeMerchantUserId().split(",");
                boolean hasPer = false;
                for (int i = 0; i < userIds.length; ++i) {
                    if (!this.getUserId().toString().equals(userIds[i])) continue;
                    hasPer = true;
                }
                if (!hasPer) {
                    AjaxResult ajaxResult4 = AjaxResult.error();
                    ajaxResult4.put("msg", (Object)"\u5546\u5bb6\u4e0d\u5728\u5238\u7684\u9002\u7528\u8303\u56f4");
                    return ajaxResult4;
                }
            }
            if (UserCouponStatus.EXPIRE.getValue() == sysUserExCouponDTO.getStatus()) {
                ajaxResult = AjaxResult.error();
                ajaxResult.put("msg", (Object)"\u5238\u7801\u5df2\u8fc7\u671f");
                return ajaxResult;
            }
            if (UserCouponStatus.USED.getValue() == sysUserExCouponDTO.getStatus()) {
                ajaxResult = AjaxResult.error();
                ajaxResult.put("msg", (Object)"\u5238\u7801\u5df2\u88ab\u4f7f\u7528\u8fc7");
                return ajaxResult;
            }
            sysUserExCoupon.setStatus(UserCouponStatus.USED.getValue());
            int res = this.sysUserExCouponService.writeOffUserCoupon(sysUserExCoupon);
            if (res > 0) {
                CouponVerifyLog couponVerifyLog = new CouponVerifyLog();
                couponVerifyLog.setUserCouponId(sysUserExCouponDTO.getId());
                couponVerifyLog.setCouponNo(sysUserExCoupon.getCouponNo());
                couponVerifyLog.setCouponName(sysUserExCouponDTO.getCouponName());
                couponVerifyLog.setUserId(sysUserExCouponDTO.getUserId());
                couponVerifyLog.setVerifyById(this.getUserId());
                UserExMerchant userExMerchant = this.iUserExMerchantService.selectUserExMerchantByUserId(this.getUserId());
                if (null != userExMerchant) {
                    couponVerifyLog.setVerifyMerchantName(userExMerchant.getMerchantName());
                }
                PlateformData plateformData = new PlateformData();
                plateformData.setDataKey("AMOUNT_POINTS_RATIO");
                List list = this.plateformDataService.selectPlateformDataList(plateformData);
                if (list.size() > 0) {
                    PlateformData plateformDataVO = (PlateformData)list.get(0);
                    if (!TextUtils.isEmpty((CharSequence)plateformDataVO.getDataValue())) {
                        BigDecimal rate = new BigDecimal(plateformDataVO.getDataValue());
                        UserExtendsData userExtendsData = new UserExtendsData();
                        userExtendsData.setUserId(sysUserExCouponDTO.getUserId());
                        userExtendsData.setStatus(Long.valueOf(1L));
                        userExtendsData.setValidityType(Long.valueOf(1L));
                        UserExtendsData userExtendsDataDTO = this.sysUserService.selectUserLevelAndPoints(userExtendsData);
                        BigDecimal point = null;
                        if (null != userExtendsDataDTO && null != userExtendsDataDTO.getPointRate()) {
                            point = sysUserExCouponDTO.getCouponPrice().multiply(rate).multiply(userExtendsDataDTO.getPointRate());
                        }
                        if (null != point) {
                            UserExtendsData userExtendsDataVo = this.userExtendsDataService.selectUserExtendsDataByUserId(sysUserExCouponDTO.getUserId());
                            int count = 0;
                            if (null != userExtendsDataVo) {
                                if (null != userExtendsDataVo.getUserPoint()) {
                                    userExtendsDataVo.setUserPoint(userExtendsDataVo.getUserPoint().add(point));
                                }
                                count = this.userExtendsDataService.updateUserExtendsData(userExtendsDataVo);
                            } else {
                                userExtendsDataVo = new UserExtendsData();
                                userExtendsDataVo.setUserId(sysUserExCouponDTO.getUserId());
                                userExtendsDataVo.setUserPoint(point);
                                count = this.userExtendsDataService.insertUserExtendsData(userExtendsDataVo);
                            }
                            if (count > 0) {
                                UserExtendsDataLog userExtendsDataLog = new UserExtendsDataLog();
                                userExtendsDataLog.setUserId(userExtendsData.getUserId());
                                userExtendsDataLog.setExType(Long.valueOf(1L));
                                userExtendsDataLog.setExRemark("\u4f18\u60e0\u5238\u6838\u9500");
                                userExtendsDataLog.setExPoint("+" + point);
                                this.iUserExtendsDataLogService.insertUserExtendsDataLog(userExtendsDataLog);
                            }
                            BigDecimal noZeros = point.stripTrailingZeros();
                            String result = noZeros.toPlainString();
                            couponVerifyLog.setRemark("\u6838\u9500\u6210\u529f\uff0c\u83b7\u5f97\u79ef\u5206\uff1a" + result);
                        } else {
                            couponVerifyLog.setRemark("\u6838\u9500\u6210\u529f");
                        }
                    } else {
                        couponVerifyLog.setRemark("\u6838\u9500\u6210\u529f");
                    }
                } else {
                    couponVerifyLog.setRemark("\u6838\u9500\u6210\u529f");
                }
                this.couponVerifyLogService.insertCouponVerifyLog(couponVerifyLog);
            }
            return this.toAjax(res);
        }
        catch (Exception e) {
            TransactionAspectSupport.currentTransactionStatus().setRollbackOnly();
            AjaxResult ajaxResult = AjaxResult.error();
            ajaxResult.put("msg", (Object)"\u6838\u9500\u5931\u8d25");
            return ajaxResult;
        }
    }

    @PreAuthorize(value="@ss.hasPermi('system:role:client')")
    @PostMapping(value={"/checkCoupon"})
    public AjaxResult checkCoupon(Long userCouponId) {
        CouponVerifyLog couponVerifyLog = this.couponVerifyLogService.selectCouponVerifyLogByUserCouponId(userCouponId);
        if (couponVerifyLog != null) {
            AjaxResult ajaxResult = AjaxResult.success();
            ajaxResult.put("data", (Object)couponVerifyLog);
            return ajaxResult;
        }
        AjaxResult ajaxResult = AjaxResult.error();
        return ajaxResult;
    }

    @PostMapping(value={"/verifyList"})
    public TableDataInfo verifyList(CouponVerifyLog couponVerifyLog) {
        this.startPage();
        List list = this.couponVerifyLogService.selectCouponVerifyLogList(couponVerifyLog);
        return this.getDataTable(list);
    }

    @PostMapping(value={"/canUseCouponList"})
    public TableDataInfo canUseCouponList(SysUserExCoupon sysUserExCoupon) {
        this.startPage();
        List list = this.sysUserExCouponService.selectCanUseCouponList(sysUserExCoupon);
        return this.getDataTable(list);
    }
}
