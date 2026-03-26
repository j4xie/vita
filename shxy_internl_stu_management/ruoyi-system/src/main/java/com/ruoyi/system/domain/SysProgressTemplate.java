package com.ruoyi.system.domain;

import org.apache.commons.lang3.builder.ToStringBuilder;
import org.apache.commons.lang3.builder.ToStringStyle;
import com.ruoyi.common.core.domain.BaseEntity;

/**
 * 流程管理对象 sys_progress_manage
 * 
 * @author ruoyi
 * @date 2026-02-28
 */
public class SysProgressTemplate extends BaseEntity
{
    private static final long serialVersionUID = 1L;

    /** 主键 */
    private Long id;

    /** 流程模板名称 */
    private String progressName;

    /** 所属分类id */
    private Long typeId;

    /** 分类名称 */
    private String typeName;

    /** 流程管理JSON */
    private String progressContent;

    /** 模板用途的描述说明 */
    private String progressDesc;

    /** 适用对象 （1-所有人     2-指定学校/部门     3-指定角色     4-指定人员） */
    private Long accessFlag;

    /** 适用对象对应的id */
    private String accessIds;

    /** 是否可用：  1 可用      -1 不可用 */
    private Integer enabled;

    /** 创建人user_id */
    private Long createByUserId;

    /** 创建人的法定姓名 */
    private String createByLegalName;

    /** 更新人user_id */
    private Long updateByUserId;

    /** 更新人的法定姓名 */
    private String updateByLegalName;

    public String getTypeName() {
        return typeName;
    }

    public void setTypeName(String typeName) {
        this.typeName = typeName;
    }

    public void setId(Long id)
    {
        this.id = id;
    }

    public String getProgressContent() {
        return progressContent;
    }

    public void setProgressContent(String progressContent) {
        this.progressContent = progressContent;
    }

    public Integer getEnabled() {
        return enabled;
    }

    public void setEnabled(Integer enabled) {
        this.enabled = enabled;
    }

    public Long getId()
    {
        return id;
    }

    public String getProgressName() {
        return progressName;
    }

    public void setProgressName(String progressName) {
        this.progressName = progressName;
    }

    public Long getTypeId() {
        return typeId;
    }

    public void setTypeId(Long typeId) {
        this.typeId = typeId;
    }

    public String getProgressDesc() {
        return progressDesc;
    }

    public void setProgressDesc(String progressDesc) {
        this.progressDesc = progressDesc;
    }

    public Long getAccessFlag() {
        return accessFlag;
    }

    public void setAccessFlag(Long accessFlag) {
        this.accessFlag = accessFlag;
    }

    public String getAccessIds() {
        return accessIds;
    }

    public void setAccessIds(String accessIds) {
        this.accessIds = accessIds;
    }

    public Long getCreateByUserId() {
        return createByUserId;
    }

    public void setCreateByUserId(Long createByUserId) {
        this.createByUserId = createByUserId;
    }

    public String getCreateByLegalName() {
        return createByLegalName;
    }

    public void setCreateByLegalName(String createByLegalName) {
        this.createByLegalName = createByLegalName;
    }

    public Long getUpdateByUserId() {
        return updateByUserId;
    }

    public void setUpdateByUserId(Long updateByUserId) {
        this.updateByUserId = updateByUserId;
    }

    public String getUpdateByLegalName() {
        return updateByLegalName;
    }

    public void setUpdateByLegalName(String updateByLegalName) {
        this.updateByLegalName = updateByLegalName;
    }

    @Override
    public String toString() {
        return new ToStringBuilder(this,ToStringStyle.MULTI_LINE_STYLE)
            .append("id", getId())
            .toString();
    }
}
