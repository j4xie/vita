package com.ruoyi.system.mapper;

import java.util.List;
import com.ruoyi.system.domain.MallPointGoods;

/**
 * 积分商品Mapper接口
 * 
 * @author ruoyi
 * @date 2025-09-15
 */
public interface MallPointGoodsMapper 
{
    /**
     * 查询积分商品
     * 
     * @param id 积分商品主键
     * @return 积分商品
     */
    public MallPointGoods selectMallPointGoodsById(Long id);

    /**
     * 查询积分商品列表
     * 
     * @param mallPointGoods 积分商品
     * @return 积分商品集合
     */
    public List<MallPointGoods> selectMallPointGoodsList(MallPointGoods mallPointGoods);

    /**
     * 新增积分商品
     * 
     * @param mallPointGoods 积分商品
     * @return 结果
     */
    public int insertMallPointGoods(MallPointGoods mallPointGoods);

    /**
     * 修改积分商品
     * 
     * @param mallPointGoods 积分商品
     * @return 结果
     */
    public int updateMallPointGoods(MallPointGoods mallPointGoods);

    /**
     * 退回商品库存
     * @param mallPointGoods
     * @return
     */
    public int refundGoodsQuantity(MallPointGoods mallPointGoods);

    /**
     * 删除积分商品
     * 
     * @param id 积分商品主键
     * @return 结果
     */
    public int deleteMallPointGoodsById(Long id);

    /**
     * 批量删除积分商品
     * 
     * @param ids 需要删除的数据主键集合
     * @return 结果
     */
    public int deleteMallPointGoodsByIds(Long[] ids);
}
