package com.ruoyi.system.service;

import java.util.List;
import com.ruoyi.system.domain.SysProgressTemplate;

/**
 * 流程管理Service接口
 * 
 * @author ruoyi
 * @date 2026-02-28
 */
public interface ISysProgressTemplateService
{
    /**
     * 查询流程管理
     * 
     * @param id 流程管理主键
     * @return 流程管理
     */
    public SysProgressTemplate selectSysProgressTemplateById(Long id);

    /**
     * 查询流程管理列表
     * 
     * @param sysProgressTemplate 流程管理
     * @return 流程管理集合
     */
    public List<SysProgressTemplate> selectSysProgressTemplateList(SysProgressTemplate sysProgressTemplate);

    /**
     * 新增流程管理
     * 
     * @param sysProgressTemplate 流程管理
     * @return 结果
     */
    public int insertSysProgressTemplate(SysProgressTemplate sysProgressTemplate);

    /**
     * 修改流程管理
     * 
     * @param sysProgressTemplate 流程管理
     * @return 结果
     */
    public int updateSysProgressTemplate(SysProgressTemplate sysProgressTemplate);

    /**
     * 批量删除流程管理
     * 
     * @param ids 需要删除的流程管理主键集合
     * @return 结果
     */
    public int deleteSysProgressTemplateByIds(Long[] ids);

    /**
     * 删除流程管理信息
     * 
     * @param id 流程管理主键
     * @return 结果
     */
    public int deleteSysProgressTemplateById(Long id);
}
