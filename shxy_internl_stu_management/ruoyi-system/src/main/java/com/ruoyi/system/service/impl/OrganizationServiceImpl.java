package com.ruoyi.system.service.impl;

import java.util.List;
import com.ruoyi.common.utils.DateUtils;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import com.ruoyi.system.mapper.OrganizationMapper;
import com.ruoyi.system.domain.Organization;
import com.ruoyi.system.service.IOrganizationService;

/**
 * 组织Service业务层处理
 * 
 * @author ruoyi
 * @date 2025-08-19
 */
@Service
public class OrganizationServiceImpl implements IOrganizationService 
{
    @Autowired
    private OrganizationMapper organizationMapper;

    /**
     * 查询组织
     * 
     * @param id 组织主键
     * @return 组织
     */
    @Override
    public Organization selectOrganizationById(Long id)
    {
        return organizationMapper.selectOrganizationById(id);
    }

    /**
     * 查询组织列表
     * 
     * @param organization 组织
     * @return 组织
     */
    @Override
    public List<Organization> selectOrganizationList(Organization organization)
    {
        return organizationMapper.selectOrganizationList(organization);
    }

    /**
     * 新增组织
     * 
     * @param organization 组织
     * @return 结果
     */
    @Override
    public int insertOrganization(Organization organization)
    {
        organization.setCreateTime(DateUtils.getNowDate());
        return organizationMapper.insertOrganization(organization);
    }

    /**
     * 修改组织
     * 
     * @param organization 组织
     * @return 结果
     */
    @Override
    public int updateOrganization(Organization organization)
    {
        return organizationMapper.updateOrganization(organization);
    }

    /**
     * 批量删除组织
     * 
     * @param ids 需要删除的组织主键
     * @return 结果
     */
    @Override
    public int deleteOrganizationByIds(Long[] ids)
    {
        return organizationMapper.deleteOrganizationByIds(ids);
    }

    /**
     * 删除组织信息
     * 
     * @param id 组织主键
     * @return 结果
     */
    @Override
    public int deleteOrganizationById(Long id)
    {
        return organizationMapper.deleteOrganizationById(id);
    }
}
