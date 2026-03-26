package com.ruoyi.system.service.impl;

import java.util.List;
import com.ruoyi.common.utils.DateUtils;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import com.ruoyi.system.mapper.SysProgressTypeMapper;
import com.ruoyi.system.domain.SysProgressType;
import com.ruoyi.system.service.ISysProgressTypeService;

/**
 * 流程分类Service业务层处理
 * 
 * @author ruoyi
 * @date 2026-03-24
 */
@Service
public class SysProgressTypeServiceImpl implements ISysProgressTypeService 
{
    @Autowired
    private SysProgressTypeMapper sysProgressTypeMapper;

    /**
     * 查询流程分类
     * 
     * @param id 流程分类主键
     * @return 流程分类
     */
    @Override
    public SysProgressType selectSysProgressTypeById(Long id)
    {
        return sysProgressTypeMapper.selectSysProgressTypeById(id);
    }

    /**
     * 查询流程分类列表
     * 
     * @param sysProgressType 流程分类
     * @return 流程分类
     */
    @Override
    public List<SysProgressType> selectSysProgressTypeList(SysProgressType sysProgressType)
    {
        return sysProgressTypeMapper.selectSysProgressTypeList(sysProgressType);
    }

    /**
     * 新增流程分类
     * 
     * @param sysProgressType 流程分类
     * @return 结果
     */
    @Override
    public int insertSysProgressType(SysProgressType sysProgressType)
    {
        sysProgressType.setCreateTime(DateUtils.getNowDate());
        return sysProgressTypeMapper.insertSysProgressType(sysProgressType);
    }

    /**
     * 修改流程分类
     * 
     * @param sysProgressType 流程分类
     * @return 结果
     */
    @Override
    public int updateSysProgressType(SysProgressType sysProgressType)
    {
        return sysProgressTypeMapper.updateSysProgressType(sysProgressType);
    }

    /**
     * 批量删除流程分类
     * 
     * @param ids 需要删除的流程分类主键
     * @return 结果
     */
    @Override
    public int deleteSysProgressTypeByIds(Long[] ids)
    {
        return sysProgressTypeMapper.deleteSysProgressTypeByIds(ids);
    }

    /**
     * 删除流程分类信息
     * 
     * @param id 流程分类主键
     * @return 结果
     */
    @Override
    public int deleteSysProgressTypeById(Long id)
    {
        return sysProgressTypeMapper.deleteSysProgressTypeById(id);
    }
}
