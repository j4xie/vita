package com.ruoyi.system.service;

import java.util.List;
import com.ruoyi.system.domain.CouponVerifyLog;

/**
 * 券核销记录Service接口
 * 
 * @author ruoyi
 * @date 2025-10-21
 */
public interface ICouponVerifyLogService 
{
    /**
     * 查询券核销记录
     * 
     * @param id 券核销记录主键
     * @return 券核销记录
     */
    public CouponVerifyLog selectCouponVerifyLogById(Long id);

    /**
     * 根据用户券的id获取记录
     * @param userCouponId
     * @return
     */
    public CouponVerifyLog selectCouponVerifyLogByUserCouponId(Long userCouponId);

    /**
     * 查询券核销记录列表
     * 
     * @param couponVerifyLog 券核销记录
     * @return 券核销记录集合
     */
    public List<CouponVerifyLog> selectCouponVerifyLogList(CouponVerifyLog couponVerifyLog);

    /**
     * 新增券核销记录
     * 
     * @param couponVerifyLog 券核销记录
     * @return 结果
     */
    public int insertCouponVerifyLog(CouponVerifyLog couponVerifyLog);

    /**
     * 修改券核销记录
     * 
     * @param couponVerifyLog 券核销记录
     * @return 结果
     */
    public int updateCouponVerifyLog(CouponVerifyLog couponVerifyLog);

    /**
     * 批量删除券核销记录
     * 
     * @param ids 需要删除的券核销记录主键集合
     * @return 结果
     */
    public int deleteCouponVerifyLogByIds(Long[] ids);

    /**
     * 删除券核销记录信息
     * 
     * @param id 券核销记录主键
     * @return 结果
     */
    public int deleteCouponVerifyLogById(Long id);
}
