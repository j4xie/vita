package com.ruoyi.system.service.impl;

import java.util.List;
import com.ruoyi.common.utils.DateUtils;
import com.ruoyi.system.domain.EquityData;
import com.ruoyi.system.domain.UserLevelExEquity;
import com.ruoyi.system.mapper.EquityDataMapper;
import com.ruoyi.system.mapper.UserLevelExEquityMapper;
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

    @Autowired
    private UserLevelExEquityMapper userLevelExEquityMapper;

    @Autowired
    private EquityDataMapper equityDataMapper;

    /**
     * 查询会员等级
     * 
     * @param id 会员等级主键
     * @return 会员等级
     */
    @Override
    public SysUserLevel selectSysUserLevelById(Long id)
    {
        SysUserLevel sysUserLevel = sysUserLevelMapper.selectSysUserLevelById(id);

        UserLevelExEquity userLevelExEquity = new UserLevelExEquity();
        userLevelExEquity.setLevelId(sysUserLevel.getId());
        List<UserLevelExEquity> userLevelExEquityList = userLevelExEquityMapper.selectUserLevelExEquityList(userLevelExEquity);
        sysUserLevel.setUserLevelExEquityList(userLevelExEquityList);

        Long[] equids = new Long[userLevelExEquityList.size()];
        for(int j = 0; j < userLevelExEquityList.size(); j++){
            equids[j] =  userLevelExEquityList.get(j).getEquityId();
        }
        sysUserLevel.setEquids(equids);

        return sysUserLevel;
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

        List<SysUserLevel> sysUserLevelList = sysUserLevelMapper.selectSysUserLevelList(sysUserLevel);
        for(int i = 0; i < sysUserLevelList.size(); i++){
            UserLevelExEquity userLevelExEquity = new UserLevelExEquity();
            userLevelExEquity.setLevelId(sysUserLevelList.get(i).getId());
            List<UserLevelExEquity> userLevelExEquityList = userLevelExEquityMapper.selectUserLevelExEquityList(userLevelExEquity);
            sysUserLevelList.get(i).setUserLevelExEquityList(userLevelExEquityList);

            Long[] equids = new Long[userLevelExEquityList.size()];
            //String memberBenefits = "";
            for(int j = 0; j < userLevelExEquityList.size(); j++){
                equids[j] =  userLevelExEquityList.get(j).getEquityId();
                //memberBenefits = memberBenefits + "\n" + userLevelExEquityList.get(j).getEquName();
            }
            //sysUserLevelList.get(i).setMemberBenefits(memberBenefits);
            sysUserLevelList.get(i).setEquids(equids);
        }

        return sysUserLevelList;
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
        int count = sysUserLevelMapper.insertSysUserLevel(sysUserLevel);
        if(count > 0){
            if(sysUserLevel.getEquids().length > 0){
                for(int i = 0;i < sysUserLevel.getEquids().length; i++){
                    EquityData equityData = equityDataMapper.selectEquityDataById(sysUserLevel.getEquids()[i]);

                    UserLevelExEquity userLevelExEquity =  new UserLevelExEquity();
                    userLevelExEquity.setLevelId(sysUserLevel.getId());
                    userLevelExEquity.setEquityId(equityData.getId());
                    userLevelExEquity.setEquName(equityData.getEquName());
                    userLevelExEquity.setEquTag(equityData.getEquTag());
                    userLevelExEquity.setEquSort(equityData.getEquSort());
                    userLevelExEquity.setCreateTime(DateUtils.getNowDate());
                    userLevelExEquityMapper.insertUserLevelExEquity(userLevelExEquity);
                }
            }
        }
        return count;
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
        int count = sysUserLevelMapper.updateSysUserLevel(sysUserLevel);

        if(count > 0){
            userLevelExEquityMapper.deleteUserLevelExEquityByLevelId(sysUserLevel.getId());

            if(sysUserLevel.getEquids().length > 0){
                for(int i = 0;i < sysUserLevel.getEquids().length; i++){
                    EquityData equityData = equityDataMapper.selectEquityDataById(sysUserLevel.getEquids()[i]);

                    UserLevelExEquity userLevelExEquity =  new UserLevelExEquity();
                    userLevelExEquity.setLevelId(sysUserLevel.getId());
                    userLevelExEquity.setEquityId(equityData.getId());
                    userLevelExEquity.setEquName(equityData.getEquName());
                    userLevelExEquity.setEquTag(equityData.getEquTag());
                    userLevelExEquity.setEquSort(equityData.getEquSort());
                    userLevelExEquity.setCreateTime(DateUtils.getNowDate());
                    userLevelExEquityMapper.insertUserLevelExEquity(userLevelExEquity);
                }
            }
        }

        return count;
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
