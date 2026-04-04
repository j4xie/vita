/*
 * Decompiled with CFR 0.152.
 */
package com.ruoyi.system.mapper;

import com.ruoyi.system.domain.Organization;
import java.util.List;

public interface OrganizationMapper {
    public Organization selectOrganizationById(Long var1);

    public List<Organization> selectOrganizationList(Organization var1);

    public int insertOrganization(Organization var1);

    public int updateOrganization(Organization var1);

    public int deleteOrganizationById(Long var1);

    public int deleteOrganizationByIds(Long[] var1);
}

