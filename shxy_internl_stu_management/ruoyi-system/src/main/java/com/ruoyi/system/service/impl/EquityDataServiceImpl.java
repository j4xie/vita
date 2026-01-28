package com.ruoyi.system.service.impl;

import java.util.List;
import com.ruoyi.common.utils.DateUtils;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import com.ruoyi.system.mapper.EquityDataMapper;
import com.ruoyi.system.domain.EquityData;
import com.ruoyi.system.service.IEquityDataService;

/**
 * 核心权益管理Service业务层处理
 * 
 * @author ruoyi
 * @date 2026-01-28
 */
@Service
public class EquityDataServiceImpl implements IEquityDataService 
{
    @Autowired
    private EquityDataMapper equityDataMapper;

    /**
     * 查询核心权益管理
     * 
     * @param id 核心权益管理主键
     * @return 核心权益管理
     */
    @Override
    public EquityData selectEquityDataById(Long id)
    {
        return equityDataMapper.selectEquityDataById(id);
    }


    /**
     * 根据标识查询
     * @param equTag
     * @return
     */
    @Override
    public EquityData selectEquityDataByTag(String equTag) {
        return equityDataMapper.selectEquityDataByTag(equTag);
    }

    /**
     * 查询核心权益管理列表
     * 
     * @param equityData 核心权益管理
     * @return 核心权益管理
     */
    @Override
    public List<EquityData> selectEquityDataList(EquityData equityData)
    {
        return equityDataMapper.selectEquityDataList(equityData);
    }

    /**
     * 新增核心权益管理
     * 
     * @param equityData 核心权益管理
     * @return 结果
     */
    @Override
    public int insertEquityData(EquityData equityData)
    {
        equityData.setCreateTime(DateUtils.getNowDate());
        return equityDataMapper.insertEquityData(equityData);
    }

    /**
     * 修改核心权益管理
     * 
     * @param equityData 核心权益管理
     * @return 结果
     */
    @Override
    public int updateEquityData(EquityData equityData)
    {
        equityData.setUpdateTime(DateUtils.getNowDate());
        return equityDataMapper.updateEquityData(equityData);
    }

    /**
     * 批量删除核心权益管理
     * 
     * @param ids 需要删除的核心权益管理主键
     * @return 结果
     */
    @Override
    public int deleteEquityDataByIds(Long[] ids)
    {
        return equityDataMapper.deleteEquityDataByIds(ids);
    }

    /**
     * 删除核心权益管理信息
     * 
     * @param id 核心权益管理主键
     * @return 结果
     */
    @Override
    public int deleteEquityDataById(Long id)
    {
        return equityDataMapper.deleteEquityDataById(id);
    }
}
