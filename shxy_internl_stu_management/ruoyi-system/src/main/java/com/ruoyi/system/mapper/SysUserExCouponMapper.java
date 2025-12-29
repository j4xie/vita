package com.ruoyi.system.mapper;

import java.util.List;
import com.ruoyi.system.domain.SysUserExCoupon;

/**
 * 用户关联优惠券Mapper接口
 * 
 * @author ruoyi
 * @date 2025-09-25
 */
public interface SysUserExCouponMapper 
{
    /**
     * 查询用户关联优惠券
     * 
     * @param id 用户关联优惠券主键
     * @return 用户关联优惠券
     */
    public SysUserExCoupon selectSysUserExCouponById(Long id);

    /**
     * 根据券码查询优惠券
     * @param couponNo
     * @return
     */
    public SysUserExCoupon selectSysUserExCouponByNo(String couponNo);

    /**
     * 查询用户关联优惠券列表
     * 
     * @param sysUserExCoupon 用户关联优惠券
     * @return 用户关联优惠券集合
     */
    public List<SysUserExCoupon> selectSysUserExCouponList(SysUserExCoupon sysUserExCoupon);

    /**
     * 查询用户在当前商家可用的券
     * @param sysUserExCoupon
     * @return
     */
    public List<SysUserExCoupon> selectCanUseCouponList(SysUserExCoupon sysUserExCoupon);

    /**
     * 新增用户关联优惠券
     * 
     * @param sysUserExCoupon 用户关联优惠券
     * @return 结果
     */
    public int insertSysUserExCoupon(SysUserExCoupon sysUserExCoupon);

    /**
     * 修改用户关联优惠券
     * 
     * @param sysUserExCoupon 用户关联优惠券
     * @return 结果
     */
    public int updateSysUserExCoupon(SysUserExCoupon sysUserExCoupon);

    /**
     * 核销优惠券
     * @param sysUserExCoupon
     * @return
     */
    public int writeOffUserCoupon(SysUserExCoupon sysUserExCoupon);

    /**
     * 删除用户关联优惠券
     * 
     * @param id 用户关联优惠券主键
     * @return 结果
     */
    public int deleteSysUserExCouponById(Long id);

    /**
     * 批量删除用户关联优惠券
     * 
     * @param ids 需要删除的数据主键集合
     * @return 结果
     */
    public int deleteSysUserExCouponByIds(Long[] ids);

    /**
     * 发放优惠券
     *
     * @param sysUserExCoupon 用户关联优惠券
     * @return 结果
     */
    public int issueCoupons(SysUserExCoupon sysUserExCoupon);
}
