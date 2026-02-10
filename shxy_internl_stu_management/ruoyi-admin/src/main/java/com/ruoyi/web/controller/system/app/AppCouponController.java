package com.ruoyi.web.controller.system.app;

import com.ruoyi.common.annotation.Log;
import com.ruoyi.common.core.controller.BaseController;
import com.ruoyi.common.core.domain.AjaxResult;
import com.ruoyi.common.core.domain.entity.SysRole;
import com.ruoyi.common.core.domain.entity.UserExtendsDataLog;
import com.ruoyi.common.core.page.TableDataInfo;
import com.ruoyi.common.enums.BusinessType;
import com.ruoyi.common.enums.CouponType;
import com.ruoyi.common.enums.RoleKey;
import com.ruoyi.common.enums.UserCouponStatus;
import com.ruoyi.system.domain.*;
import com.ruoyi.system.service.*;
import org.apache.http.util.TextUtils;
import org.aspectj.weaver.loadtime.Aj;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.parameters.P;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.transaction.interceptor.TransactionAspectSupport;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.math.BigDecimal;
import java.util.List;

/**
 * 优惠券Controller
 *
 * @author ruoyi
 * @date 2025-08-18
 */
@RestController
@RequestMapping("/app/coupon")
public class AppCouponController extends BaseController {

    @Autowired
    private ISysCouponService sysCouponService;

    @Autowired
    IUserExMerchantService userExMerchantService;

    @Autowired
    private ISysUserExCouponService sysUserExCouponService;

    @Autowired
    private IUserExtendsDataService  userExtendsDataService;

    @Autowired
    private ISysUserExLevelService  sysUserExLevelService;

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

    /**
     * 查询用户关联优惠券列表
     */
    @PreAuthorize("@ss.hasPermi('system:role:client')")
    @GetMapping("/userCouponlist")
    public TableDataInfo list(SysUserExCoupon sysUserExCoupon)
    {
        sysUserExCoupon.setUserId(getUserId());
        startPage();
        List<SysUserExCoupon> list = sysUserExCouponService.selectSysUserExCouponList(sysUserExCoupon);
        return getDataTable(list);
    }

    /**
     * 优惠券核销接口
     * @param sysUserExCoupon
     * @return
     */
    //@PreAuthorize("@ss.hasPermi('system:role:client')")
    @Transactional(rollbackFor = Exception.class)
    @Log(title = "用户端核销券", businessType = BusinessType.UPDATE)
    @PostMapping("/writeOff")
    public AjaxResult writeOff(SysUserExCoupon sysUserExCoupon)
    {
        try{
            if(TextUtils.isEmpty(sysUserExCoupon.getCouponNo())){
                AjaxResult ajaxResult = AjaxResult.error();
                ajaxResult.put("msg", "请输入优惠券码");
                return ajaxResult;
            }
            //校验券码是否存在
            SysUserExCoupon sysUserExCouponDTO = sysUserExCouponService.selectSysUserExCouponByNo(sysUserExCoupon.getCouponNo());
            if(null == sysUserExCouponDTO){
                AjaxResult ajaxResult = AjaxResult.error();
                ajaxResult.put("msg", "券码不存在");
                return ajaxResult;
            }else{
                //判断当前商户是否有核销权限
                if(sysUserExCouponDTO.getPurpose() == 2){
                    String [] userIds = sysUserExCouponDTO.getPurposeMerchantUserId().split(",");
                    boolean hasPer = false;
                    for(int i = 0;i < userIds.length; i++){
                        if(getUserId().toString().equals(userIds[i])){
                            hasPer = true;
                        }
                    }
                    if(hasPer == false){
                        AjaxResult ajaxResult = AjaxResult.error();
                        ajaxResult.put("msg", "商家不在券的适用范围");
                        return ajaxResult;
                    }
                }
                if(UserCouponStatus.EXPIRE.getValue() == sysUserExCouponDTO.getStatus()){
                    AjaxResult ajaxResult = AjaxResult.error();
                    ajaxResult.put("msg", "券码已过期");
                    return ajaxResult;
                }else if(UserCouponStatus.USED.getValue() == sysUserExCouponDTO.getStatus()){
                    AjaxResult ajaxResult = AjaxResult.error();
                    ajaxResult.put("msg", "券码已被使用过");
                    return ajaxResult;
                }
            }

            sysUserExCoupon.setStatus(UserCouponStatus.USED.getValue());
            int res = sysUserExCouponService.writeOffUserCoupon(sysUserExCoupon);
            if(res > 0){

                CouponVerifyLog couponVerifyLog = new CouponVerifyLog();
                couponVerifyLog.setUserCouponId(sysUserExCouponDTO.getId());
                couponVerifyLog.setCouponNo(sysUserExCoupon.getCouponNo());
                couponVerifyLog.setCouponName(sysUserExCouponDTO.getCouponName());
                couponVerifyLog.setUserId(sysUserExCouponDTO.getUserId());
                couponVerifyLog.setVerifyById(getUserId());

                UserExMerchant userExMerchant = iUserExMerchantService.selectUserExMerchantByUserId(getUserId());
                if(null != userExMerchant){
                    couponVerifyLog.setVerifyMerchantName(userExMerchant.getMerchantName());
                }

                //查询平台积分倍率
                PlateformData plateformData = new PlateformData();
                plateformData.setDataKey("AMOUNT_POINTS_RATIO");
                List<PlateformData> list = plateformDataService.selectPlateformDataList(plateformData);
                if(list.size() > 0){
                    PlateformData plateformDataVO = list.get(0);
                    if(!TextUtils.isEmpty(plateformDataVO.getDataValue())){
                        BigDecimal rate = new BigDecimal(plateformDataVO.getDataValue());
                        //查询会员等级及对应等级的积分倍数
                        UserExtendsData userExtendsData = new UserExtendsData();
                        userExtendsData.setUserId(sysUserExCouponDTO.getUserId());
                        userExtendsData.setStatus(1L);
                        userExtendsData.setValidityType(1L);
                        UserExtendsData userExtendsDataDTO = sysUserService.selectUserLevelAndPoints(userExtendsData);

                        BigDecimal point = null;
                        if(null != userExtendsDataDTO && null != userExtendsDataDTO.getPointRate()){
                            point = sysUserExCouponDTO.getCouponPrice().multiply(rate).multiply(userExtendsDataDTO.getPointRate());
                        }

                        if(null != point){
                            //查询会员积分信息
                            UserExtendsData userExtendsDataVo = userExtendsDataService.selectUserExtendsDataByUserId(sysUserExCouponDTO.getUserId());
                            int count = 0;
                            if(null != userExtendsDataVo){
                                if(null != userExtendsDataVo.getUserPoint()){
                                    userExtendsDataVo.setUserPoint(userExtendsDataVo.getUserPoint().add(point));
                                }
                                count = userExtendsDataService.updateUserExtendsData(userExtendsDataVo);
                            }else{
                                userExtendsDataVo = new UserExtendsData();
                                userExtendsDataVo.setUserId(sysUserExCouponDTO.getUserId());
                                userExtendsDataVo.setUserPoint(point);
                                count = userExtendsDataService.insertUserExtendsData(userExtendsDataVo);
                            }
                            if(count > 0){
                                //记录积分变更日志
                                UserExtendsDataLog userExtendsDataLog = new UserExtendsDataLog();
                                userExtendsDataLog.setUserId(userExtendsData.getUserId());
                                userExtendsDataLog.setExType(1L);
                                userExtendsDataLog.setExRemark("优惠券核销");
                                userExtendsDataLog.setExPoint("+"+point);
                                iUserExtendsDataLogService.insertUserExtendsDataLog(userExtendsDataLog);
                            }


                            BigDecimal noZeros = point.stripTrailingZeros();
                            String result = noZeros.toPlainString();
                            couponVerifyLog.setRemark("核销成功，获得积分："+result);
                        }else{
                            couponVerifyLog.setRemark("核销成功");
                        }

                    }else{
                        couponVerifyLog.setRemark("核销成功");
                    }
                }else{
                    couponVerifyLog.setRemark("核销成功");
                }

                //记录核销操作
                couponVerifyLogService.insertCouponVerifyLog(couponVerifyLog);
            }
            return toAjax(res);
        } catch (Exception e) {
            //强制事务回滚
            TransactionAspectSupport.currentTransactionStatus().setRollbackOnly();
            AjaxResult ajaxResult = AjaxResult.error();
            ajaxResult.put("msg", "核销失败");
            return ajaxResult;
        }
    }

    /**
     * 根据用户券的id校验券操作记录
     * @param userCouponId
     * @return
     */
    @PreAuthorize("@ss.hasPermi('system:role:client')")
    @PostMapping("/checkCoupon")
    public AjaxResult checkCoupon(Long userCouponId)
    {
        CouponVerifyLog couponVerifyLog = couponVerifyLogService.selectCouponVerifyLogByUserCouponId(userCouponId);
        if(couponVerifyLog != null){
            AjaxResult ajaxResult = AjaxResult.success();
            ajaxResult.put("data", couponVerifyLog);
            return ajaxResult;
        }else{
            AjaxResult ajaxResult = AjaxResult.error();
            return ajaxResult;
        }
    }

    /**
     * 查询券核销记录列表
     */
    @PostMapping("/verifyList")
    public TableDataInfo verifyList(CouponVerifyLog couponVerifyLog)
    {
        startPage();
        List<CouponVerifyLog> list = couponVerifyLogService.selectCouponVerifyLogList(couponVerifyLog);
        return getDataTable(list);
    }

    /**
     * 当前用户下，指定商家可用优惠券
     * @param sysUserExCoupon
     * @return
     */
    @PostMapping("/canUseCouponList")
    public TableDataInfo canUseCouponList(SysUserExCoupon sysUserExCoupon)
    {
        startPage();
        List<SysUserExCoupon> list = sysUserExCouponService.selectCanUseCouponList(sysUserExCoupon);
        return getDataTable(list);
    }
}
