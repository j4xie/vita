package com.ruoyi.system.service.impl;

import java.util.List;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import com.ruoyi.system.mapper.SysProgressTemplateMapper;
import com.ruoyi.system.domain.SysProgressTemplate;
import com.ruoyi.system.service.ISysProgressTemplateService;

/**
 * 流程管理Service业务层处理
 * 
 * @author ruoyi
 * @date 2026-02-28
 */
@Service
public class SysProgressTemplateServiceImpl implements ISysProgressTemplateService
{
    @Autowired
    private SysProgressTemplateMapper sysProgressTemplateMapper;

    /**
     * 查询流程管理
     * 
     * @param id 流程管理主键
     * @return 流程管理
     */
    @Override
    public SysProgressTemplate selectSysProgressTemplateById(Long id)
    {
        return sysProgressTemplateMapper.selectSysProgressTemplateById(id);
    }

    /**
     * 查询流程管理列表
     * 
     * @param sysProgressTemplate 流程管理
     * @return 流程管理
     */
    @Override
    public List<SysProgressTemplate> selectSysProgressTemplateList(SysProgressTemplate sysProgressTemplate)
    {
        return sysProgressTemplateMapper.selectSysProgressTemplateList(sysProgressTemplate);
    }

    /**
     * 新增流程管理
     * 
     * @param sysProgressTemplate 流程管理
     * @return 结果
     */
    @Override
    public int insertSysProgressTemplate(SysProgressTemplate sysProgressTemplate)
    {
        return sysProgressTemplateMapper.insertSysProgressTemplate(sysProgressTemplate);
    }

    /**
     * 修改流程管理
     * 
     * @param sysProgressTemplate 流程管理
     * @return 结果
     */
    @Override
    public int updateSysProgressTemplate(SysProgressTemplate sysProgressTemplate)
    {
        return sysProgressTemplateMapper.updateSysProgressTemplate(sysProgressTemplate);
    }

    /**
     * 批量删除流程管理
     * 
     * @param ids 需要删除的流程管理主键
     * @return 结果
     */
    @Override
    public int deleteSysProgressTemplateByIds(Long[] ids)
    {
        return sysProgressTemplateMapper.deleteSysProgressTemplateByIds(ids);
    }

    /**
     * 删除流程管理信息
     * 
     * @param id 流程管理主键
     * @return 结果
     */
    @Override
    public int deleteSysProgressTemplateById(Long id)
    {
        return sysProgressTemplateMapper.deleteSysProgressTemplateById(id);
    }
}
