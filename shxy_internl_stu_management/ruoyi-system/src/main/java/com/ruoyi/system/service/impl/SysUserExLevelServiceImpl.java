package com.ruoyi.system.service.impl;

import java.util.List;
import com.ruoyi.common.utils.DateUtils;
import com.ruoyi.system.domain.SysUserLevel;
import com.ruoyi.system.mapper.SysUserLevelMapper;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import com.ruoyi.system.mapper.SysUserExLevelMapper;
import com.ruoyi.system.domain.SysUserExLevel;
import com.ruoyi.system.service.ISysUserExLevelService;

/**
 * 用户对应会员等级Service业务层处理
 * 
 * @author ruoyi
 * @date 2025-09-21
 */
@Service
public class SysUserExLevelServiceImpl implements ISysUserExLevelService 
{
    @Autowired
    private SysUserExLevelMapper sysUserExLevelMapper;

    @Autowired
    private SysUserLevelMapper sysUserLevelMapper;

    /**
     * 查询用户对应会员等级
     * 
     * @param id 用户对应会员等级主键
     * @return 用户对应会员等级
     */
    @Override
    public SysUserExLevel selectSysUserExLevelById(Long id)
    {
        return sysUserExLevelMapper.selectSysUserExLevelById(id);
    }

    /**
     * 查询用户对应会员等级列表
     * 
     * @param sysUserExLevel 用户对应会员等级
     * @return 用户对应会员等级
     */
    @Override
    public List<SysUserExLevel> selectSysUserExLevelList(SysUserExLevel sysUserExLevel)
    {
        return sysUserExLevelMapper.selectSysUserExLevelList(sysUserExLevel);
    }

    /**
     * 新增用户对应会员等级
     * 
     * @param sysUserExLevel 用户对应会员等级
     * @return 结果
     */
    @Override
    public int insertSysUserExLevel(SysUserExLevel sysUserExLevel)
    {
        sysUserExLevel.setCreateTime(DateUtils.getNowDate());
        return sysUserExLevelMapper.insertSysUserExLevel(sysUserExLevel);
    }

    /**
     * 修改用户对应会员等级
     * 
     * @param sysUserExLevel 用户对应会员等级
     * @return 结果
     */
    @Override
    public int updateSysUserExLevel(SysUserExLevel sysUserExLevel)
    {
        return sysUserExLevelMapper.updateSysUserExLevel(sysUserExLevel);
    }

    /**
     * 批量删除用户对应会员等级
     * 
     * @param ids 需要删除的用户对应会员等级主键
     * @return 结果
     */
    @Override
    public int deleteSysUserExLevelByIds(Long[] ids)
    {
        return sysUserExLevelMapper.deleteSysUserExLevelByIds(ids);
    }

    /**
     * 删除用户对应会员等级信息
     * 
     * @param id 用户对应会员等级主键
     * @return 结果
     */
    @Override
    public int deleteSysUserExLevelById(Long id)
    {
        return sysUserExLevelMapper.deleteSysUserExLevelById(id);
    }

    /**
     * 注册送会员等级
     * @param sysUserExLevel
     * @return
     */
    @Override
    public int registerSendUserLevel(SysUserExLevel sysUserExLevel){
        int count = 0;
        SysUserLevel sysUserLevel = new SysUserLevel();
        sysUserLevel.setAcquisitionMethodType("register_get");
        List<SysUserLevel> levelList = sysUserLevelMapper.selectSysUserLevelList(sysUserLevel);
        if(levelList.size() <= 0){
            count = -1;
            return count;
        }

        SysUserExLevel sysUserExLevelDTO = new SysUserExLevel();
        sysUserExLevelDTO.setUserId(sysUserExLevel.getUserId());
        sysUserExLevelDTO.setStatus(1L);
        sysUserExLevelDTO.setValidityType(1L);
        List<SysUserExLevel> list = sysUserExLevelMapper.selectSysUserExLevelList(sysUserExLevelDTO);
        if(list.size() > 0){
            for(int i = 0;i < list.size(); i++){
                sysUserExLevelMapper.deleteSysUserExLevelById(list.get(i).getId());
            }
        }

        SysUserLevel sysUserLevelVO = levelList.get(levelList.size() - 1);
        sysUserExLevel.setLevelId(sysUserLevelVO.getId());
        sysUserExLevel.setStatus(1L);
        sysUserExLevel.setValidityType(1L);

        count = sysUserExLevelMapper.insertSysUserExLevel(sysUserExLevel);
        return count;
    }

    /**
     * 认证邮箱送会员等级
     * @param sysUserExLevel
     * @return
     */
    @Override
    public int verifyEmailSendUserLevel(SysUserExLevel sysUserExLevel){
        int count = 0;
        SysUserLevel sysUserLevel = new SysUserLevel();
        sysUserLevel.setAcquisitionMethodType("verify_email_get");
        List<SysUserLevel> levelList = sysUserLevelMapper.selectSysUserLevelList(sysUserLevel);
        if(levelList.size() <= 0){
            count = -1;
            return count;
        }

        SysUserExLevel sysUserExLevelDTO = new SysUserExLevel();
        sysUserExLevelDTO.setUserId(sysUserExLevel.getUserId());
        sysUserExLevelDTO.setStatus(1L);
        sysUserExLevelDTO.setValidityType(1L);
        List<SysUserExLevel> list = sysUserExLevelMapper.selectSysUserExLevelList(sysUserExLevelDTO);
        boolean isNeedUpdate = true;
        if(list.size() > 0){
            for(int i = 0;i < list.size(); i++){
                if(list.get(i).getId() < levelList.get(0).getId()){
                    sysUserExLevelMapper.deleteSysUserExLevelById(list.get(i).getId());
                }else{
                    isNeedUpdate = false;
                }
            }
        }

        if(isNeedUpdate == true){
            SysUserLevel sysUserLevelVO = levelList.get(levelList.size() - 1);
            sysUserExLevel.setLevelId(sysUserLevelVO.getId());
            sysUserExLevel.setStatus(1L);
            sysUserExLevel.setValidityType(1L);

            count = sysUserExLevelMapper.insertSysUserExLevel(sysUserExLevel);
        }
        return count;
    }
}
