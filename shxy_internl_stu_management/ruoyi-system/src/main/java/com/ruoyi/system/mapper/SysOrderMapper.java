package com.ruoyi.system.mapper;

import java.util.List;
import com.ruoyi.system.domain.SysOrder;

/**
 * 订单Mapper接口
 * 
 * @author ruoyi
 * @date 2025-10-11
 */
public interface SysOrderMapper 
{
    /**
     * 查询订单
     * 
     * @param id 订单主键
     * @return 订单
     */
    public SysOrder selectSysOrderById(Long id);

    /**
     * 查询订单列表
     * 
     * @param sysOrder 订单
     * @return 订单集合
     */
    public List<SysOrder> selectSysOrderList(SysOrder sysOrder);

    /**
     * 新增订单
     * 
     * @param sysOrder 订单
     * @return 结果
     */
    public int insertSysOrder(SysOrder sysOrder);

    /**
     * 修改订单
     * 
     * @param sysOrder 订单
     * @return 结果
     */
    public int updateSysOrder(SysOrder sysOrder);

    /**
     * 删除订单
     * 
     * @param id 订单主键
     * @return 结果
     */
    public int deleteSysOrderById(Long id);

    /**
     * 批量删除订单
     * 
     * @param ids 需要删除的数据主键集合
     * @return 结果
     */
    public int deleteSysOrderByIds(Long[] ids);
}
