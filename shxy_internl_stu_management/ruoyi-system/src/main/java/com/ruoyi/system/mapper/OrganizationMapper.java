package com.ruoyi.system.mapper;

import java.util.List;
import com.ruoyi.system.domain.Organization;

/**
 * 组织Mapper接口
 * 
 * @author ruoyi
 * @date 2025-08-19
 */
public interface OrganizationMapper 
{
    /**
     * 查询组织
     * 
     * @param id 组织主键
     * @return 组织
     */
    public Organization selectOrganizationById(Long id);

    /**
     * 查询组织列表
     * 
     * @param organization 组织
     * @return 组织集合
     */
    public List<Organization> selectOrganizationList(Organization organization);

    /**
     * 新增组织
     * 
     * @param organization 组织
     * @return 结果
     */
    public int insertOrganization(Organization organization);

    /**
     * 修改组织
     * 
     * @param organization 组织
     * @return 结果
     */
    public int updateOrganization(Organization organization);

    /**
     * 删除组织
     * 
     * @param id 组织主键
     * @return 结果
     */
    public int deleteOrganizationById(Long id);

    /**
     * 批量删除组织
     * 
     * @param ids 需要删除的数据主键集合
     * @return 结果
     */
    public int deleteOrganizationByIds(Long[] ids);
}
