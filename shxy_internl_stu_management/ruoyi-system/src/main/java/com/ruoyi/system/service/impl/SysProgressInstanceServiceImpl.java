package com.ruoyi.system.service.impl;

import java.util.List;
import com.ruoyi.common.utils.DateUtils;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import com.ruoyi.system.mapper.SysProgressInstanceMapper;
import com.ruoyi.system.domain.SysProgressInstance;
import com.ruoyi.system.service.ISysProgressInstanceService;

/**
 * 审批实例Service业务层处理
 * 
 * @author ruoyi
 * @date 2026-03-25
 */
@Service
public class SysProgressInstanceServiceImpl implements ISysProgressInstanceService 
{
    @Autowired
    private SysProgressInstanceMapper sysProgressInstanceMapper;

    /**
     * 查询审批实例
     * 
     * @param id 审批实例主键
     * @return 审批实例
     */
    @Override
    public SysProgressInstance selectSysProgressInstanceById(Long id)
    {
        return sysProgressInstanceMapper.selectSysProgressInstanceById(id);
    }

    /**
     * 查询审批实例列表
     * 
     * @param sysProgressInstance 审批实例
     * @return 审批实例
     */
    @Override
    public List<SysProgressInstance> selectSysProgressInstanceList(SysProgressInstance sysProgressInstance)
    {
        return sysProgressInstanceMapper.selectSysProgressInstanceList(sysProgressInstance);
    }

    /**
     * 新增审批实例
     * 
     * @param sysProgressInstance 审批实例
     * @return 结果
     */
    @Override
    public int insertSysProgressInstance(SysProgressInstance sysProgressInstance)
    {
        sysProgressInstance.setCreateTime(DateUtils.getNowDate());
        return sysProgressInstanceMapper.insertSysProgressInstance(sysProgressInstance);
    }

    /**
     * 修改审批实例
     * 
     * @param sysProgressInstance 审批实例
     * @return 结果
     */
    @Override
    public int updateSysProgressInstance(SysProgressInstance sysProgressInstance)
    {
        sysProgressInstance.setUpdateTime(DateUtils.getNowDate());
        return sysProgressInstanceMapper.updateSysProgressInstance(sysProgressInstance);
    }

    /**
     * 批量删除审批实例
     * 
     * @param ids 需要删除的审批实例主键
     * @return 结果
     */
    @Override
    public int deleteSysProgressInstanceByIds(Long[] ids)
    {
        return sysProgressInstanceMapper.deleteSysProgressInstanceByIds(ids);
    }

    /**
     * 删除审批实例信息
     * 
     * @param id 审批实例主键
     * @return 结果
     */
    @Override
    public int deleteSysProgressInstanceById(Long id)
    {
        return sysProgressInstanceMapper.deleteSysProgressInstanceById(id);
    }
}
