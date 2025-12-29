package com.ruoyi.system.service;

import java.util.List;
import com.ruoyi.system.domain.SysUserLevel;

/**
 * 会员等级Service接口
 * 
 * @author ruoyi
 * @date 2025-09-19
 */
public interface ISysUserLevelService 
{
    /**
     * 查询会员等级
     * 
     * @param id 会员等级主键
     * @return 会员等级
     */
    public SysUserLevel selectSysUserLevelById(Long id);

    /**
     * 查询会员等级列表
     * 
     * @param sysUserLevel 会员等级
     * @return 会员等级集合
     */
    public List<SysUserLevel> selectSysUserLevelList(SysUserLevel sysUserLevel);

    /**
     * 新增会员等级
     * 
     * @param sysUserLevel 会员等级
     * @return 结果
     */
    public int insertSysUserLevel(SysUserLevel sysUserLevel);

    /**
     * 修改会员等级
     * 
     * @param sysUserLevel 会员等级
     * @return 结果
     */
    public int updateSysUserLevel(SysUserLevel sysUserLevel);

    /**
     * 批量删除会员等级
     * 
     * @param ids 需要删除的会员等级主键集合
     * @return 结果
     */
    public int deleteSysUserLevelByIds(Long[] ids);

    /**
     * 删除会员等级信息
     * 
     * @param id 会员等级主键
     * @return 结果
     */
    public int deleteSysUserLevelById(Long id);
}
