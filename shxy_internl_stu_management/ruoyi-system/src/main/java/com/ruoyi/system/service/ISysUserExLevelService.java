package com.ruoyi.system.service;

import java.util.List;
import com.ruoyi.system.domain.SysUserExLevel;

/**
 * 用户对应会员等级Service接口
 * 
 * @author ruoyi
 * @date 2025-09-21
 */
public interface ISysUserExLevelService 
{
    /**
     * 查询用户对应会员等级
     * 
     * @param id 用户对应会员等级主键
     * @return 用户对应会员等级
     */
    public SysUserExLevel selectSysUserExLevelById(Long id);

    /**
     * 查询用户对应会员等级列表
     * 
     * @param sysUserExLevel 用户对应会员等级
     * @return 用户对应会员等级集合
     */
    public List<SysUserExLevel> selectSysUserExLevelList(SysUserExLevel sysUserExLevel);

    /**
     * 新增用户对应会员等级
     * 
     * @param sysUserExLevel 用户对应会员等级
     * @return 结果
     */
    public int insertSysUserExLevel(SysUserExLevel sysUserExLevel);

    /**
     * 修改用户对应会员等级
     * 
     * @param sysUserExLevel 用户对应会员等级
     * @return 结果
     */
    public int updateSysUserExLevel(SysUserExLevel sysUserExLevel);

    /**
     * 批量删除用户对应会员等级
     * 
     * @param ids 需要删除的用户对应会员等级主键集合
     * @return 结果
     */
    public int deleteSysUserExLevelByIds(Long[] ids);

    /**
     * 删除用户对应会员等级信息
     * 
     * @param id 用户对应会员等级主键
     * @return 结果
     */
    public int deleteSysUserExLevelById(Long id);

    /**
     * 注册送会员等级
     * @param sysUserExLevel
     * @return
     */
    public int registerSendUserLevel(SysUserExLevel sysUserExLevel);


    /**
     * 认证邮箱送会员等级
     * @param sysUserExLevel
     * @return
     */
    public int verifyEmailSendUserLevel(SysUserExLevel sysUserExLevel);
}
