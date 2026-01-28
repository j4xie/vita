package com.ruoyi.common.core.domain.entity;

import java.util.Date;
import java.util.List;
import javax.validation.constraints.*;
import org.apache.commons.lang3.builder.ToStringBuilder;
import org.apache.commons.lang3.builder.ToStringStyle;
import com.ruoyi.common.annotation.Excel;
import com.ruoyi.common.annotation.Excel.ColumnType;
import com.ruoyi.common.annotation.Excel.Type;
import com.ruoyi.common.annotation.Excels;
import com.ruoyi.common.core.domain.BaseEntity;
import com.ruoyi.common.xss.Xss;

/**
 * 用户对象 sys_user
 * 
 * @author ruoyi
 */
public class SysUser extends BaseEntity
{
    private static final long serialVersionUID = 1L;

    /** 用户ID */
    @Excel(name = "用户序号", type = Type.EXPORT, cellType = ColumnType.NUMERIC, prompt = "用户编号")
    private Long userId;

    /** 部门ID */
    @Excel(name = "部门编号", type = Type.IMPORT)
    private Long deptId;

    /** 法定姓名 */
    @Excel(name = "法定姓名")
    private String legalName;

    /** 用户账号 */
    @Excel(name = "登录名称")
    private String userName;

    /** 用户昵称 */
    @Excel(name = "用户名称")
    private String nickName;

    /** 用户邮箱 */
    @Excel(name = "用户邮箱")
    private String email;

    /** 邮箱是否验证（-1否     1是） */
    private Integer isEmailVerify;

    /** 手机号码 */
    @Excel(name = "手机号码", cellType = ColumnType.TEXT)
    private String phonenumber;

    /** 用户性别 */
    @Excel(name = "用户性别", readConverterExp = "0=男,1=女,2=未知")
    private String sex;

    /** 用户头像 */
    private String avatar;

    /** 密码 */
    private String password;

    /** 账号状态（0正常 1停用） */
    @Excel(name = "账号状态", readConverterExp = "0=正常,1=停用")
    private String status;

    /** 删除标志（0代表存在 2代表删除） */
    private String delFlag;

    /** 最后登录IP */
    @Excel(name = "最后登录IP", type = Type.EXPORT)
    private String loginIp;

    /** 最后登录时间 */
    @Excel(name = "最后登录时间", width = 30, dateFormat = "yyyy-MM-dd HH:mm:ss", type = Type.EXPORT)
    private Date loginDate;

    /** 密码最后更新时间 */
    private Date pwdUpdateDate;

    /** 部门对象 */
    @Excels({
        @Excel(name = "部门名称", targetAttr = "deptName", type = Type.EXPORT),
        @Excel(name = "部门负责人", targetAttr = "leader", type = Type.EXPORT)
    })
    private SysDept dept;

    /** 角色对象 */
    private List<SysRole> roles;

    private SysRole role;

    private SysPost post;

    public SysPost getPost() {
        return post;
    }

    public void setPost(SysPost post) {
        this.post = post;
    }

    /** 角色组 */
    private Long[] roleIds;

    /** 岗位组 */
    private Long[] postIds;

    /** 岗位ID */
    private Long postId;

    /** 角色ID */
    private Long roleId;

    //手机验证码
    private String verCode;

    //邀请码
    private String invCode;

    private String bizId;
    
    private Long orgId;

    private String area;

    private String areaCode;

    /**
     * 是否商户    1-是   -1-否
     */
    private int isMerchant;


    //身份（1-学生   2-家长  3-其他）
    private int identity;

    private String alternateEmail;

    private Long levelId;

    private String levelName;

    /** 推荐人userId */
    private Long referUserId;

    public Long getReferUserId() {
        return referUserId;
    }

    public void setReferUserId(Long referUserId) {
        this.referUserId = referUserId;
    }

    public Long getLevelId() {
        return levelId;
    }

    public void setLevelId(Long levelId) {
        this.levelId = levelId;
    }

    public String getLevelName() {
        return levelName;
    }

    public void setLevelName(String levelName) {
        this.levelName = levelName;
    }

    public Integer getIsEmailVerify() {
        return isEmailVerify;
    }

    public void setIsEmailVerify(Integer isEmailVerify) {
        this.isEmailVerify = isEmailVerify;
    }

    public String getAlternateEmail() {
        return alternateEmail;
    }

    public void setAlternateEmail(String alternateEmail) {
        this.alternateEmail = alternateEmail;
    }

    public Long getPostId() {
        return postId;
    }

    public void setPostId(Long postId) {
        this.postId = postId;
    }

    public int getIdentity() {
        return identity;
    }

    public void setIdentity(int identity) {
        this.identity = identity;
    }

    public String getAreaCode() {
        return areaCode;
    }

    public void setAreaCode(String areaCode) {
        this.areaCode = areaCode;
    }

    public String getArea() {
        return area;
    }

    public void setArea(String area) {
        this.area = area;
    }

    public Long getOrgId() {
        return orgId;
    }

    public void setOrgId(Long orgId) {
        this.orgId = orgId;
    }

    public String getBizId() {
        return bizId;
    }

    public void setBizId(String bizId) {
        this.bizId = bizId;
    }

    public String getVerCode() {
        return verCode;
    }

    public void setVerCode(String verCode) {
        this.verCode = verCode;
    }

    public String getInvCode() {
        return invCode;
    }

    public void setInvCode(String invCode) {
        this.invCode = invCode;
    }

    public SysUser()
    {

    }

    public String getLegalName() {
        return legalName;
    }

    public void setLegalName(String legalName) {
        this.legalName = legalName;
    }

    public SysUser(Long userId)
    {
        this.userId = userId;
    }

    public Long getUserId()
    {
        return userId;
    }

    public void setUserId(Long userId)
    {
        this.userId = userId;
    }

    public boolean isAdmin()
    {
        return isAdmin(this.userId);
    }

    public static boolean isAdmin(Long userId)
    {
        return userId != null && 1L == userId;
    }

    public Long getDeptId()
    {
        return deptId;
    }

    public void setDeptId(Long deptId)
    {
        this.deptId = deptId;
    }

    @Xss(message = "用户昵称不能包含脚本字符")
    @Size(min = 0, max = 30, message = "用户昵称长度不能超过30个字符")
    public String getNickName()
    {
        return nickName;
    }

    public void setNickName(String nickName)
    {
        this.nickName = nickName;
    }

    @Xss(message = "用户账号不能包含脚本字符")
    @NotBlank(message = "用户账号不能为空")
    @Size(min = 0, max = 30, message = "用户账号长度不能超过30个字符")
    public String getUserName()
    {
        return userName;
    }

    public void setUserName(String userName)
    {
        this.userName = userName;
    }

    @Email(message = "邮箱格式不正确")
    @Size(min = 0, max = 50, message = "邮箱长度不能超过50个字符")
    public String getEmail()
    {
        return email;
    }

    public void setEmail(String email)
    {
        this.email = email;
    }

    @Size(min = 0, max = 11, message = "手机号码长度不能超过11个字符")
    public String getPhonenumber()
    {
        return phonenumber;
    }

    public void setPhonenumber(String phonenumber)
    {
        this.phonenumber = phonenumber;
    }

    public String getSex()
    {
        return sex;
    }

    public void setSex(String sex)
    {
        this.sex = sex;
    }

    public String getAvatar()
    {
        return avatar;
    }

    public void setAvatar(String avatar)
    {
        this.avatar = avatar;
    }

    public String getPassword()
    {
        return password;
    }

    public void setPassword(String password)
    {
        this.password = password;
    }

    public String getStatus()
    {
        return status;
    }

    public void setStatus(String status)
    {
        this.status = status;
    }

    public String getDelFlag()
    {
        return delFlag;
    }

    public void setDelFlag(String delFlag)
    {
        this.delFlag = delFlag;
    }

    public String getLoginIp()
    {
        return loginIp;
    }

    public void setLoginIp(String loginIp)
    {
        this.loginIp = loginIp;
    }

    public Date getLoginDate()
    {
        return loginDate;
    }

    public void setLoginDate(Date loginDate)
    {
        this.loginDate = loginDate;
    }

    public Date getPwdUpdateDate()
    {
        return pwdUpdateDate;
    }

    public void setPwdUpdateDate(Date pwdUpdateDate)
    {
        this.pwdUpdateDate = pwdUpdateDate;
    }

    public SysDept getDept()
    {
        return dept;
    }

    public void setDept(SysDept dept)
    {
        this.dept = dept;
    }

    public List<SysRole> getRoles()
    {
        return roles;
    }

    public void setRoles(List<SysRole> roles)
    {
        this.roles = roles;
    }

    public Long[] getRoleIds()
    {
        return roleIds;
    }

    public void setRoleIds(Long[] roleIds)
    {
        this.roleIds = roleIds;
    }

    public Long[] getPostIds()
    {
        return postIds;
    }

    public void setPostIds(Long[] postIds)
    {
        this.postIds = postIds;
    }

    public Long getRoleId()
    {
        return roleId;
    }

    public void setRoleId(Long roleId)
    {
        this.roleId = roleId;
    }

    public SysRole getRole() {
        return role;
    }

    public void setRole(SysRole role) {
        this.role = role;
    }

    public int getIsMerchant() {
        return isMerchant;
    }

    public void setIsMerchant(int isMerchant) {
        this.isMerchant = isMerchant;
    }


    @Override
    public String toString() {
        return new ToStringBuilder(this,ToStringStyle.MULTI_LINE_STYLE)
            .append("userId", getUserId())
            .append("deptId", getDeptId())
            .append("userName", getUserName())
            .append("legalName", getLegalName())
            .append("nickName", getNickName())
            .append("email", getEmail())
            .append("phonenumber", getPhonenumber())
            .append("sex", getSex())
            .append("avatar", getAvatar())
            .append("password", getPassword())
            .append("status", getStatus())
            .append("delFlag", getDelFlag())
            .append("loginIp", getLoginIp())
            .append("loginDate", getLoginDate())
            .append("pwdUpdateDate", getPwdUpdateDate())
            .append("createBy", getCreateBy())
            .append("createTime", getCreateTime())
            .append("updateBy", getUpdateBy())
            .append("updateTime", getUpdateTime())
            .append("remark", getRemark())
            .append("dept", getDept())
            .toString();
    }
}
