package com.ruoyi.system.service.impl;

import java.util.List;
import com.ruoyi.common.utils.DateUtils;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import com.ruoyi.system.mapper.MallPointGoodsMapper;
import com.ruoyi.system.domain.MallPointGoods;
import com.ruoyi.system.service.IMallPointGoodsService;

/**
 * 积分商品Service业务层处理
 * 
 * @author ruoyi
 * @date 2025-09-15
 */
@Service
public class MallPointGoodsServiceImpl implements IMallPointGoodsService 
{
    @Autowired
    private MallPointGoodsMapper mallPointGoodsMapper;

    /**
     * 查询积分商品
     * 
     * @param id 积分商品主键
     * @return 积分商品
     */
    @Override
    public MallPointGoods selectMallPointGoodsById(Long id)
    {
        return mallPointGoodsMapper.selectMallPointGoodsById(id);
    }

    /**
     * 查询积分商品列表
     * 
     * @param mallPointGoods 积分商品
     * @return 积分商品
     */
    @Override
    public List<MallPointGoods> selectMallPointGoodsList(MallPointGoods mallPointGoods)
    {
        return mallPointGoodsMapper.selectMallPointGoodsList(mallPointGoods);
    }

    /**
     * 新增积分商品
     * 
     * @param mallPointGoods 积分商品
     * @return 结果
     */
    @Override
    public int insertMallPointGoods(MallPointGoods mallPointGoods)
    {
        mallPointGoods.setCreateTime(DateUtils.getNowDate());
        return mallPointGoodsMapper.insertMallPointGoods(mallPointGoods);
    }

    /**
     * 修改积分商品
     * 
     * @param mallPointGoods 积分商品
     * @return 结果
     */
    @Override
    public int updateMallPointGoods(MallPointGoods mallPointGoods)
    {
        mallPointGoods.setUpdateTime(DateUtils.getNowDate());
        return mallPointGoodsMapper.updateMallPointGoods(mallPointGoods);
    }

    /**
     * 退回商品库存
     * @param mallPointGoods
     * @return
     */
    @Override
    public int refundGoodsQuantity(MallPointGoods mallPointGoods){
        mallPointGoods.setUpdateTime(DateUtils.getNowDate());
        return mallPointGoodsMapper.refundGoodsQuantity(mallPointGoods);
    }

    /**
     * 批量删除积分商品
     * 
     * @param ids 需要删除的积分商品主键
     * @return 结果
     */
    @Override
    public int deleteMallPointGoodsByIds(Long[] ids)
    {
        return mallPointGoodsMapper.deleteMallPointGoodsByIds(ids);
    }

    /**
     * 删除积分商品信息
     * 
     * @param id 积分商品主键
     * @return 结果
     */
    @Override
    public int deleteMallPointGoodsById(Long id)
    {
        return mallPointGoodsMapper.deleteMallPointGoodsById(id);
    }
}
