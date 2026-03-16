package com.ruoyi.system.service.impl;

import java.util.List;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import com.ruoyi.system.mapper.SysProgressManageMapper;
import com.ruoyi.system.domain.SysProgressManage;
import com.ruoyi.system.service.ISysProgressManageService;

/**
 * 流程管理Service业务层处理
 * 
 * @author ruoyi
 * @date 2026-02-28
 */
@Service
public class SysProgressManageServiceImpl implements ISysProgressManageService 
{
    @Autowired
    private SysProgressManageMapper sysProgressManageMapper;

    /**
     * 查询流程管理
     * 
     * @param id 流程管理主键
     * @return 流程管理
     */
    @Override
    public SysProgressManage selectSysProgressManageById(Long id)
    {
        return sysProgressManageMapper.selectSysProgressManageById(id);
    }

    /**
     * 查询流程管理列表
     * 
     * @param sysProgressManage 流程管理
     * @return 流程管理
     */
    @Override
    public List<SysProgressManage> selectSysProgressManageList(SysProgressManage sysProgressManage)
    {
        return sysProgressManageMapper.selectSysProgressManageList(sysProgressManage);
    }

    /**
     * 新增流程管理
     * 
     * @param sysProgressManage 流程管理
     * @return 结果
     */
    @Override
    public int insertSysProgressManage(SysProgressManage sysProgressManage)
    {
        return sysProgressManageMapper.insertSysProgressManage(sysProgressManage);
    }

    /**
     * 修改流程管理
     * 
     * @param sysProgressManage 流程管理
     * @return 结果
     */
    @Override
    public int updateSysProgressManage(SysProgressManage sysProgressManage)
    {
        return sysProgressManageMapper.updateSysProgressManage(sysProgressManage);
    }

    /**
     * 批量删除流程管理
     * 
     * @param ids 需要删除的流程管理主键
     * @return 结果
     */
    @Override
    public int deleteSysProgressManageByIds(Long[] ids)
    {
        return sysProgressManageMapper.deleteSysProgressManageByIds(ids);
    }

    /**
     * 删除流程管理信息
     * 
     * @param id 流程管理主键
     * @return 结果
     */
    @Override
    public int deleteSysProgressManageById(Long id)
    {
        return sysProgressManageMapper.deleteSysProgressManageById(id);
    }
}
