package com.ruoyi.system.service;

import java.util.List;
import com.ruoyi.system.domain.SysCoupon;

/**
 * 优惠券Service接口
 * 
 * @author ruoyi
 * @date 2025-09-17
 */
public interface ISysCouponService 
{
    /**
     * 查询优惠券
     * 
     * @param id 优惠券主键
     * @return 优惠券
     */
    public SysCoupon selectSysCouponById(Long id);

    /**
     * 查询优惠券列表
     * 
     * @param sysCoupon 优惠券
     * @return 优惠券集合
     */
    public List<SysCoupon> selectSysCouponList(SysCoupon sysCoupon);

    /**
     * 新增优惠券
     * 
     * @param sysCoupon 优惠券
     * @return 结果
     */
    public int insertSysCoupon(SysCoupon sysCoupon);

    /**
     * 修改优惠券
     * 
     * @param sysCoupon 优惠券
     * @return 结果
     */
    public int updateSysCoupon(SysCoupon sysCoupon);

    /**
     * 批量删除优惠券
     * 
     * @param ids 需要删除的优惠券主键集合
     * @return 结果
     */
    public int deleteSysCouponByIds(Long[] ids);

    /**
     * 删除优惠券信息
     * 
     * @param id 优惠券主键
     * @return 结果
     */
    public int deleteSysCouponById(Long id);
}
