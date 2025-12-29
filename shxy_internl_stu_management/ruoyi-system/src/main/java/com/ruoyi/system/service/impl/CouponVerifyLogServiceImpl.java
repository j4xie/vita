package com.ruoyi.system.service.impl;

import java.util.List;
import com.ruoyi.common.utils.DateUtils;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import com.ruoyi.system.mapper.CouponVerifyLogMapper;
import com.ruoyi.system.domain.CouponVerifyLog;
import com.ruoyi.system.service.ICouponVerifyLogService;

/**
 * 券核销记录Service业务层处理
 * 
 * @author ruoyi
 * @date 2025-10-21
 */
@Service
public class CouponVerifyLogServiceImpl implements ICouponVerifyLogService 
{
    @Autowired
    private CouponVerifyLogMapper couponVerifyLogMapper;

    /**
     * 查询券核销记录
     * 
     * @param id 券核销记录主键
     * @return 券核销记录
     */
    @Override
    public CouponVerifyLog selectCouponVerifyLogById(Long id)
    {
        return couponVerifyLogMapper.selectCouponVerifyLogById(id);
    }

    /**
     * 根据用户券的id获取记录
     * @param userCouponId
     * @return
     */
    @Override
    public CouponVerifyLog selectCouponVerifyLogByUserCouponId(Long userCouponId){
        return couponVerifyLogMapper.selectCouponVerifyLogByUserCouponId(userCouponId);
    }

    /**
     * 查询券核销记录列表
     * 
     * @param couponVerifyLog 券核销记录
     * @return 券核销记录
     */
    @Override
    public List<CouponVerifyLog> selectCouponVerifyLogList(CouponVerifyLog couponVerifyLog)
    {
        return couponVerifyLogMapper.selectCouponVerifyLogList(couponVerifyLog);
    }

    /**
     * 新增券核销记录
     * 
     * @param couponVerifyLog 券核销记录
     * @return 结果
     */
    @Override
    public int insertCouponVerifyLog(CouponVerifyLog couponVerifyLog)
    {
        couponVerifyLog.setCreateTime(DateUtils.getNowDate());
        return couponVerifyLogMapper.insertCouponVerifyLog(couponVerifyLog);
    }

    /**
     * 修改券核销记录
     * 
     * @param couponVerifyLog 券核销记录
     * @return 结果
     */
    @Override
    public int updateCouponVerifyLog(CouponVerifyLog couponVerifyLog)
    {
        return couponVerifyLogMapper.updateCouponVerifyLog(couponVerifyLog);
    }

    /**
     * 批量删除券核销记录
     * 
     * @param ids 需要删除的券核销记录主键
     * @return 结果
     */
    @Override
    public int deleteCouponVerifyLogByIds(Long[] ids)
    {
        return couponVerifyLogMapper.deleteCouponVerifyLogByIds(ids);
    }

    /**
     * 删除券核销记录信息
     * 
     * @param id 券核销记录主键
     * @return 结果
     */
    @Override
    public int deleteCouponVerifyLogById(Long id)
    {
        return couponVerifyLogMapper.deleteCouponVerifyLogById(id);
    }
}
