package com.ruoyi.system.service.impl;

import java.util.List;

import com.ruoyi.common.utils.CommonUtils;
import com.ruoyi.common.utils.DateUtils;
import org.apache.http.util.TextUtils;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import com.ruoyi.system.mapper.SysCouponMapper;
import com.ruoyi.system.domain.SysCoupon;
import com.ruoyi.system.service.ISysCouponService;

/**
 * 优惠券Service业务层处理
 * 
 * @author ruoyi
 * @date 2025-09-17
 */
@Service
public class SysCouponServiceImpl implements ISysCouponService 
{
    @Autowired
    private SysCouponMapper sysCouponMapper;

    /**
     * 查询优惠券
     * 
     * @param id 优惠券主键
     * @return 优惠券
     */
    @Override
    public SysCoupon selectSysCouponById(Long id)
    {
        return sysCouponMapper.selectSysCouponById(id);
    }

    /**
     * 查询优惠券列表
     * 
     * @param sysCoupon 优惠券
     * @return 优惠券
     */
    @Override
    public List<SysCoupon> selectSysCouponList(SysCoupon sysCoupon)
    {
        return sysCouponMapper.selectSysCouponList(sysCoupon);
    }

    /**
     * 新增优惠券
     * 
     * @param sysCoupon 优惠券
     * @return 结果
     */
    @Override
    public int insertSysCoupon(SysCoupon sysCoupon)
    {
        sysCoupon.setCreateTime(DateUtils.getNowDate());
        int count = sysCouponMapper.insertSysCoupon(sysCoupon);
        /*if(count > 0 && TextUtils.isEmpty(sysCoupon.getCouponNo())){
            SysCoupon sysCouponDto = new SysCoupon();
            sysCouponDto.setId(sysCoupon.getId());
            //生成券码
            String code = "Q" + CommonUtils.genRandomNum(1) + CommonUtils.getDayStr() + CommonUtils.formatNum(sysCoupon.getId()) + CommonUtils.genRandomNum(2);
            sysCouponDto.setCouponNo(code);
            sysCouponMapper.updateSysCoupon(sysCouponDto);
        }*/
        return count;
    }

    /**
     * 修改优惠券
     * 
     * @param sysCoupon 优惠券
     * @return 结果
     */
    @Override
    public int updateSysCoupon(SysCoupon sysCoupon)
    {
        return sysCouponMapper.updateSysCoupon(sysCoupon);
    }

    /**
     * 批量删除优惠券
     * 
     * @param ids 需要删除的优惠券主键
     * @return 结果
     */
    @Override
    public int deleteSysCouponByIds(Long[] ids)
    {
        return sysCouponMapper.deleteSysCouponByIds(ids);
    }

    /**
     * 删除优惠券信息
     * 
     * @param id 优惠券主键
     * @return 结果
     */
    @Override
    public int deleteSysCouponById(Long id)
    {
        return sysCouponMapper.deleteSysCouponById(id);
    }
}
