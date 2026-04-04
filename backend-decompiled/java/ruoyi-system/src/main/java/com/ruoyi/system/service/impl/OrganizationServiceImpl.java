/*
 * Decompiled with CFR 0.152.
 * 
 * Could not load the following classes:
 *  com.ruoyi.common.utils.DateUtils
 *  org.springframework.beans.factory.annotation.Autowired
 *  org.springframework.stereotype.Service
 */
package com.ruoyi.system.service.impl;

import com.ruoyi.common.utils.DateUtils;
import com.ruoyi.system.domain.Organization;
import com.ruoyi.system.mapper.OrganizationMapper;
import com.ruoyi.system.service.IOrganizationService;
import java.util.List;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

@Service
public class OrganizationServiceImpl
implements IOrganizationService {
    @Autowired
    private OrganizationMapper organizationMapper;

    @Override
    public Organization selectOrganizationById(Long id) {
        return this.organizationMapper.selectOrganizationById(id);
    }

    @Override
    public List<Organization> selectOrganizationList(Organization organization) {
        return this.organizationMapper.selectOrganizationList(organization);
    }

    @Override
    public int insertOrganization(Organization organization) {
        organization.setCreateTime(DateUtils.getNowDate());
        return this.organizationMapper.insertOrganization(organization);
    }

    @Override
    public int updateOrganization(Organization organization) {
        return this.organizationMapper.updateOrganization(organization);
    }

    @Override
    public int deleteOrganizationByIds(Long[] ids) {
        return this.organizationMapper.deleteOrganizationByIds(ids);
    }

    @Override
    public int deleteOrganizationById(Long id) {
        return this.organizationMapper.deleteOrganizationById(id);
    }
}

