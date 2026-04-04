/*
 * Decompiled with CFR 0.152.
 * 
 * Could not load the following classes:
 *  javax.validation.constraints.Email
 *  javax.validation.constraints.NotBlank
 *  javax.validation.constraints.Size
 *  org.apache.commons.lang3.builder.ToStringBuilder
 *  org.apache.commons.lang3.builder.ToStringStyle
 */
package com.ruoyi.common.core.domain.entity;

import com.ruoyi.common.annotation.Excel;
import com.ruoyi.common.annotation.Excels;
import com.ruoyi.common.core.domain.BaseEntity;
import com.ruoyi.common.core.domain.entity.SysDept;
import com.ruoyi.common.core.domain.entity.SysPost;
import com.ruoyi.common.core.domain.entity.SysRole;
import com.ruoyi.common.core.domain.entity.UserExtendsDataLog;
import com.ruoyi.common.xss.Xss;
import java.math.BigDecimal;
import java.util.Date;
import java.util.List;
import javax.validation.constraints.Email;
import javax.validation.constraints.NotBlank;
import javax.validation.constraints.Size;
import org.apache.commons.lang3.builder.ToStringBuilder;
import org.apache.commons.lang3.builder.ToStringStyle;

public class SysUser
extends BaseEntity {
    private static final long serialVersionUID = 1L;
    @Excel(name="\u7528\u6237\u5e8f\u53f7", type=Excel.Type.EXPORT, cellType=Excel.ColumnType.NUMERIC, prompt="\u7528\u6237\u7f16\u53f7")
    private Long userId;
    @Excel(name="\u90e8\u95e8\u7f16\u53f7", type=Excel.Type.IMPORT)
    private Long deptId;
    @Excel(name="\u6cd5\u5b9a\u59d3\u540d")
    private String legalName;
    @Excel(name="\u767b\u5f55\u540d\u79f0")
    private String userName;
    @Excel(name="\u7528\u6237\u540d\u79f0")
    private String nickName;
    @Excel(name="\u7528\u6237\u90ae\u7bb1")
    private String email;
    private Integer isEmailVerify;
    @Excel(name="\u624b\u673a\u53f7\u7801", cellType=Excel.ColumnType.TEXT)
    private String phonenumber;
    @Excel(name="\u7528\u6237\u6027\u522b", readConverterExp="0=\u7537,1=\u5973,2=\u672a\u77e5")
    private String sex;
    private String avatar;
    private String password;
    @Excel(name="\u8d26\u53f7\u72b6\u6001", readConverterExp="0=\u6b63\u5e38,1=\u505c\u7528")
    private String status;
    private String delFlag;
    @Excel(name="\u6700\u540e\u767b\u5f55IP", type=Excel.Type.EXPORT)
    private String loginIp;
    @Excel(name="\u6700\u540e\u767b\u5f55\u65f6\u95f4", width=30.0, dateFormat="yyyy-MM-dd HH:mm:ss", type=Excel.Type.EXPORT)
    private Date loginDate;
    private Date pwdUpdateDate;
    @Excels(value={@Excel(name="\u90e8\u95e8\u540d\u79f0", targetAttr="deptName", type=Excel.Type.EXPORT), @Excel(name="\u90e8\u95e8\u8d1f\u8d23\u4eba", targetAttr="leader", type=Excel.Type.EXPORT)})
    private SysDept dept;
    private List<SysRole> roles;
    private SysRole role;
    private SysPost post;
    private Long[] roleIds;
    private Long[] postIds;
    private Long postId;
    private Long roleId;
    private String verCode;
    private String invCode;
    private String bizId;
    private Long orgId;
    private String area;
    private String areaCode;
    private int isMerchant;
    private int identity;
    private String alternateEmail;
    private Long levelId;
    private String levelName;
    private Long referUserId;
    private BigDecimal userPoint;
    private List<UserExtendsDataLog> userExtendsDataLogList;

    public SysPost getPost() {
        return this.post;
    }

    public void setPost(SysPost post) {
        this.post = post;
    }

    public List<UserExtendsDataLog> getUserExtendsDataLogList() {
        return this.userExtendsDataLogList;
    }

    public void setUserExtendsDataLogList(List<UserExtendsDataLog> userExtendsDataLogList) {
        this.userExtendsDataLogList = userExtendsDataLogList;
    }

    public BigDecimal getUserPoint() {
        return this.userPoint;
    }

    public void setUserPoint(BigDecimal userPoint) {
        this.userPoint = userPoint;
    }

    public Long getReferUserId() {
        return this.referUserId;
    }

    public void setReferUserId(Long referUserId) {
        this.referUserId = referUserId;
    }

    public Long getLevelId() {
        return this.levelId;
    }

    public void setLevelId(Long levelId) {
        this.levelId = levelId;
    }

    public String getLevelName() {
        return this.levelName;
    }

    public void setLevelName(String levelName) {
        this.levelName = levelName;
    }

    public Integer getIsEmailVerify() {
        return this.isEmailVerify;
    }

    public void setIsEmailVerify(Integer isEmailVerify) {
        this.isEmailVerify = isEmailVerify;
    }

    public String getAlternateEmail() {
        return this.alternateEmail;
    }

    public void setAlternateEmail(String alternateEmail) {
        this.alternateEmail = alternateEmail;
    }

    public Long getPostId() {
        return this.postId;
    }

    public void setPostId(Long postId) {
        this.postId = postId;
    }

    public int getIdentity() {
        return this.identity;
    }

    public void setIdentity(int identity) {
        this.identity = identity;
    }

    public String getAreaCode() {
        return this.areaCode;
    }

    public void setAreaCode(String areaCode) {
        this.areaCode = areaCode;
    }

    public String getArea() {
        return this.area;
    }

    public void setArea(String area) {
        this.area = area;
    }

    public Long getOrgId() {
        return this.orgId;
    }

    public void setOrgId(Long orgId) {
        this.orgId = orgId;
    }

    public String getBizId() {
        return this.bizId;
    }

    public void setBizId(String bizId) {
        this.bizId = bizId;
    }

    public String getVerCode() {
        return this.verCode;
    }

    public void setVerCode(String verCode) {
        this.verCode = verCode;
    }

    public String getInvCode() {
        return this.invCode;
    }

    public void setInvCode(String invCode) {
        this.invCode = invCode;
    }

    public SysUser() {
    }

    public String getLegalName() {
        return this.legalName;
    }

    public void setLegalName(String legalName) {
        this.legalName = legalName;
    }

    public SysUser(Long userId) {
        this.userId = userId;
    }

    public Long getUserId() {
        return this.userId;
    }

    public void setUserId(Long userId) {
        this.userId = userId;
    }

    public boolean isAdmin() {
        return SysUser.isAdmin(this.userId);
    }

    public static boolean isAdmin(Long userId) {
        return userId != null && 1L == userId;
    }

    public Long getDeptId() {
        return this.deptId;
    }

    public void setDeptId(Long deptId) {
        this.deptId = deptId;
    }

    @Xss(message="\u7528\u6237\u6635\u79f0\u4e0d\u80fd\u5305\u542b\u811a\u672c\u5b57\u7b26")
    @Size(min=0, max=30, message="\u7528\u6237\u6635\u79f0\u957f\u5ea6\u4e0d\u80fd\u8d85\u8fc730\u4e2a\u5b57\u7b26")
    public @Size(min=0, max=30, message="\u7528\u6237\u6635\u79f0\u957f\u5ea6\u4e0d\u80fd\u8d85\u8fc730\u4e2a\u5b57\u7b26") String getNickName() {
        return this.nickName;
    }

    public void setNickName(String nickName) {
        this.nickName = nickName;
    }

    @Xss(message="\u7528\u6237\u8d26\u53f7\u4e0d\u80fd\u5305\u542b\u811a\u672c\u5b57\u7b26")
    @NotBlank(message="\u7528\u6237\u8d26\u53f7\u4e0d\u80fd\u4e3a\u7a7a")
    @Size(min=0, max=30, message="\u7528\u6237\u8d26\u53f7\u957f\u5ea6\u4e0d\u80fd\u8d85\u8fc730\u4e2a\u5b57\u7b26")
    public @NotBlank(message="\u7528\u6237\u8d26\u53f7\u4e0d\u80fd\u4e3a\u7a7a") @Size(min=0, max=30, message="\u7528\u6237\u8d26\u53f7\u957f\u5ea6\u4e0d\u80fd\u8d85\u8fc730\u4e2a\u5b57\u7b26") String getUserName() {
        return this.userName;
    }

    public void setUserName(String userName) {
        this.userName = userName;
    }

    @Email(message="\u90ae\u7bb1\u683c\u5f0f\u4e0d\u6b63\u786e")
    @Size(min=0, max=50, message="\u90ae\u7bb1\u957f\u5ea6\u4e0d\u80fd\u8d85\u8fc750\u4e2a\u5b57\u7b26")
    public @Email(message="\u90ae\u7bb1\u683c\u5f0f\u4e0d\u6b63\u786e") @Size(min=0, max=50, message="\u90ae\u7bb1\u957f\u5ea6\u4e0d\u80fd\u8d85\u8fc750\u4e2a\u5b57\u7b26") String getEmail() {
        return this.email;
    }

    public void setEmail(String email) {
        this.email = email;
    }

    @Size(min=0, max=11, message="\u624b\u673a\u53f7\u7801\u957f\u5ea6\u4e0d\u80fd\u8d85\u8fc711\u4e2a\u5b57\u7b26")
    public @Size(min=0, max=11, message="\u624b\u673a\u53f7\u7801\u957f\u5ea6\u4e0d\u80fd\u8d85\u8fc711\u4e2a\u5b57\u7b26") String getPhonenumber() {
        return this.phonenumber;
    }

    public void setPhonenumber(String phonenumber) {
        this.phonenumber = phonenumber;
    }

    public String getSex() {
        return this.sex;
    }

    public void setSex(String sex) {
        this.sex = sex;
    }

    public String getAvatar() {
        return this.avatar;
    }

    public void setAvatar(String avatar) {
        this.avatar = avatar;
    }

    public String getPassword() {
        return this.password;
    }

    public void setPassword(String password) {
        this.password = password;
    }

    public String getStatus() {
        return this.status;
    }

    public void setStatus(String status) {
        this.status = status;
    }

    public String getDelFlag() {
        return this.delFlag;
    }

    public void setDelFlag(String delFlag) {
        this.delFlag = delFlag;
    }

    public String getLoginIp() {
        return this.loginIp;
    }

    public void setLoginIp(String loginIp) {
        this.loginIp = loginIp;
    }

    public Date getLoginDate() {
        return this.loginDate;
    }

    public void setLoginDate(Date loginDate) {
        this.loginDate = loginDate;
    }

    public Date getPwdUpdateDate() {
        return this.pwdUpdateDate;
    }

    public void setPwdUpdateDate(Date pwdUpdateDate) {
        this.pwdUpdateDate = pwdUpdateDate;
    }

    public SysDept getDept() {
        return this.dept;
    }

    public void setDept(SysDept dept) {
        this.dept = dept;
    }

    public List<SysRole> getRoles() {
        return this.roles;
    }

    public void setRoles(List<SysRole> roles) {
        this.roles = roles;
    }

    public Long[] getRoleIds() {
        return this.roleIds;
    }

    public void setRoleIds(Long[] roleIds) {
        this.roleIds = roleIds;
    }

    public Long[] getPostIds() {
        return this.postIds;
    }

    public void setPostIds(Long[] postIds) {
        this.postIds = postIds;
    }

    public Long getRoleId() {
        return this.roleId;
    }

    public void setRoleId(Long roleId) {
        this.roleId = roleId;
    }

    public SysRole getRole() {
        return this.role;
    }

    public void setRole(SysRole role) {
        this.role = role;
    }

    public int getIsMerchant() {
        return this.isMerchant;
    }

    public void setIsMerchant(int isMerchant) {
        this.isMerchant = isMerchant;
    }

    public String toString() {
        return new ToStringBuilder((Object)this, ToStringStyle.MULTI_LINE_STYLE).append("userId", (Object)this.getUserId()).append("deptId", (Object)this.getDeptId()).append("userName", (Object)this.getUserName()).append("legalName", (Object)this.getLegalName()).append("nickName", (Object)this.getNickName()).append("email", (Object)this.getEmail()).append("phonenumber", (Object)this.getPhonenumber()).append("sex", (Object)this.getSex()).append("avatar", (Object)this.getAvatar()).append("password", (Object)this.getPassword()).append("status", (Object)this.getStatus()).append("delFlag", (Object)this.getDelFlag()).append("loginIp", (Object)this.getLoginIp()).append("loginDate", (Object)this.getLoginDate()).append("pwdUpdateDate", (Object)this.getPwdUpdateDate()).append("createBy", (Object)this.getCreateBy()).append("createTime", (Object)this.getCreateTime()).append("updateBy", (Object)this.getUpdateBy()).append("updateTime", (Object)this.getUpdateTime()).append("remark", (Object)this.getRemark()).append("dept", (Object)this.getDept()).toString();
    }
}

