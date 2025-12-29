package com.ruoyi.system.service;

import java.util.List;
import com.ruoyi.system.domain.SysOrder;

/**
 * 订单Service接口
 * 
 * @author ruoyi
 * @date 2025-10-11
 */
public interface ISysOrderService 
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
     * 取消订单
     * @param orderId
     * @return
     */
    public int cancelOrder(Long orderId, String cancelReason);

    /**
     * 批量删除订单
     * 
     * @param ids 需要删除的订单主键集合
     * @return 结果
     */
    public int deleteSysOrderByIds(Long[] ids);

    /**
     * 删除订单信息
     * 
     * @param id 订单主键
     * @return 结果
     */
    public int deleteSysOrderById(Long id);
}
