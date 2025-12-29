package com.ruoyi.system.service.impl;

import java.util.List;
import com.ruoyi.common.utils.DateUtils;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import com.ruoyi.system.mapper.SysUserLevelMapper;
import com.ruoyi.system.domain.SysUserLevel;
import com.ruoyi.system.service.ISysUserLevelService;

/**
 * 会员等级Service业务层处理
 * 
 * @author ruoyi
 * @date 2025-09-19
 */
@Service
public class SysUserLevelServiceImpl implements ISysUserLevelService 
{
    @Autowired
    private SysUserLevelMapper sysUserLevelMapper;

    /**
     * 查询会员等级
     * 
     * @param id 会员等级主键
     * @return 会员等级
     */
    @Override
    public SysUserLevel selectSysUserLevelById(Long id)
    {
        return sysUserLevelMapper.selectSysUserLevelById(id);
    }

    /**
     * 查询会员等级列表
     * 
     * @param sysUserLevel 会员等级
     * @return 会员等级
     */
    @Override
    public List<SysUserLevel> selectSysUserLevelList(SysUserLevel sysUserLevel)
    {
        return sysUserLevelMapper.selectSysUserLevelList(sysUserLevel);
    }

    /**
     * 新增会员等级
     * 
     * @param sysUserLevel 会员等级
     * @return 结果
     */
    @Override
    public int insertSysUserLevel(SysUserLevel sysUserLevel)
    {
        sysUserLevel.setCreateTime(DateUtils.getNowDate());
        return sysUserLevelMapper.insertSysUserLevel(sysUserLevel);
    }

    /**
     * 修改会员等级
     * 
     * @param sysUserLevel 会员等级
     * @return 结果
     */
    @Override
    public int updateSysUserLevel(SysUserLevel sysUserLevel)
    {
        sysUserLevel.setUpdateTime(DateUtils.getNowDate());
        return sysUserLevelMapper.updateSysUserLevel(sysUserLevel);
    }

    /**
     * 批量删除会员等级
     * 
     * @param ids 需要删除的会员等级主键
     * @return 结果
     */
    @Override
    public int deleteSysUserLevelByIds(Long[] ids)
    {
        return sysUserLevelMapper.deleteSysUserLevelByIds(ids);
    }

    /**
     * 删除会员等级信息
     * 
     * @param id 会员等级主键
     * @return 结果
     */
    @Override
    public int deleteSysUserLevelById(Long id)
    {
        return sysUserLevelMapper.deleteSysUserLevelById(id);
    }
}
