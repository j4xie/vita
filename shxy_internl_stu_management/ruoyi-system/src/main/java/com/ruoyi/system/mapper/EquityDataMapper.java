package com.ruoyi.system.mapper;

import java.util.List;
import com.ruoyi.system.domain.EquityData;

/**
 * 核心权益管理Mapper接口
 * 
 * @author ruoyi
 * @date 2026-01-28
 */
public interface EquityDataMapper 
{
    /**
     * 查询核心权益管理
     * 
     * @param id 核心权益管理主键
     * @return 核心权益管理
     */
    public EquityData selectEquityDataById(Long id);

    /**
     * 根据标识查询
     * @param equTag
     * @return
     */
    public EquityData selectEquityDataByTag(String equTag);

    /**
     * 查询核心权益管理列表
     * 
     * @param equityData 核心权益管理
     * @return 核心权益管理集合
     */
    public List<EquityData> selectEquityDataList(EquityData equityData);

    /**
     * 新增核心权益管理
     * 
     * @param equityData 核心权益管理
     * @return 结果
     */
    public int insertEquityData(EquityData equityData);

    /**
     * 修改核心权益管理
     * 
     * @param equityData 核心权益管理
     * @return 结果
     */
    public int updateEquityData(EquityData equityData);

    /**
     * 删除核心权益管理
     * 
     * @param id 核心权益管理主键
     * @return 结果
     */
    public int deleteEquityDataById(Long id);

    /**
     * 批量删除核心权益管理
     * 
     * @param ids 需要删除的数据主键集合
     * @return 结果
     */
    public int deleteEquityDataByIds(Long[] ids);
}
