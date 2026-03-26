package com.ruoyi.system.service;

import java.util.List;
import com.ruoyi.system.domain.SysProgressInstance;

/**
 * 审批实例Service接口
 * 
 * @author ruoyi
 * @date 2026-03-25
 */
public interface ISysProgressInstanceService 
{
    /**
     * 查询审批实例
     * 
     * @param id 审批实例主键
     * @return 审批实例
     */
    public SysProgressInstance selectSysProgressInstanceById(Long id);

    /**
     * 查询审批实例列表
     * 
     * @param sysProgressInstance 审批实例
     * @return 审批实例集合
     */
    public List<SysProgressInstance> selectSysProgressInstanceList(SysProgressInstance sysProgressInstance);

    /**
     * 新增审批实例
     * 
     * @param sysProgressInstance 审批实例
     * @return 结果
     */
    public int insertSysProgressInstance(SysProgressInstance sysProgressInstance);

    /**
     * 修改审批实例
     * 
     * @param sysProgressInstance 审批实例
     * @return 结果
     */
    public int updateSysProgressInstance(SysProgressInstance sysProgressInstance);

    /**
     * 批量删除审批实例
     * 
     * @param ids 需要删除的审批实例主键集合
     * @return 结果
     */
    public int deleteSysProgressInstanceByIds(Long[] ids);

    /**
     * 删除审批实例信息
     * 
     * @param id 审批实例主键
     * @return 结果
     */
    public int deleteSysProgressInstanceById(Long id);
}
