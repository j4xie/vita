package com.ruoyi.system.mapper;

import java.util.List;
import com.ruoyi.system.domain.SysUserLevel;

/**
 * 会员等级Mapper接口
 * 
 * @author ruoyi
 * @date 2025-09-19
 */
public interface SysUserLevelMapper 
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
     * 删除会员等级
     * 
     * @param id 会员等级主键
     * @return 结果
     */
    public int deleteSysUserLevelById(Long id);

    /**
     * 批量删除会员等级
     * 
     * @param ids 需要删除的数据主键集合
     * @return 结果
     */
    public int deleteSysUserLevelByIds(Long[] ids);
}
