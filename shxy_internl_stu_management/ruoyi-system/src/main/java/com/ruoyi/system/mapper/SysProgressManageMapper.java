package com.ruoyi.system.mapper;

import java.util.List;
import com.ruoyi.system.domain.SysProgressManage;

/**
 * 流程管理Mapper接口
 * 
 * @author ruoyi
 * @date 2026-02-28
 */
public interface SysProgressManageMapper 
{
    /**
     * 查询流程管理
     * 
     * @param id 流程管理主键
     * @return 流程管理
     */
    public SysProgressManage selectSysProgressManageById(Long id);

    /**
     * 查询流程管理列表
     * 
     * @param sysProgressManage 流程管理
     * @return 流程管理集合
     */
    public List<SysProgressManage> selectSysProgressManageList(SysProgressManage sysProgressManage);

    /**
     * 新增流程管理
     * 
     * @param sysProgressManage 流程管理
     * @return 结果
     */
    public int insertSysProgressManage(SysProgressManage sysProgressManage);

    /**
     * 修改流程管理
     * 
     * @param sysProgressManage 流程管理
     * @return 结果
     */
    public int updateSysProgressManage(SysProgressManage sysProgressManage);

    /**
     * 删除流程管理
     * 
     * @param id 流程管理主键
     * @return 结果
     */
    public int deleteSysProgressManageById(Long id);

    /**
     * 批量删除流程管理
     * 
     * @param ids 需要删除的数据主键集合
     * @return 结果
     */
    public int deleteSysProgressManageByIds(Long[] ids);
}
