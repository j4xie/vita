package com.ruoyi.system.service;

import java.util.List;
import com.ruoyi.system.domain.UserExMerchantAuditLog;

/**
 * 商户审核日志Service接口
 * 
 * @author ruoyi
 * @date 2025-09-16
 */
public interface IUserExMerchantAuditLogService 
{
    /**
     * 查询商户审核日志
     * 
     * @param id 商户审核日志主键
     * @return 商户审核日志
     */
    public UserExMerchantAuditLog selectUserExMerchantAuditLogById(Long id);

    /**
     * 查询商户审核日志列表
     * 
     * @param userExMerchantAuditLog 商户审核日志
     * @return 商户审核日志集合
     */
    public List<UserExMerchantAuditLog> selectUserExMerchantAuditLogList(UserExMerchantAuditLog userExMerchantAuditLog);

    /**
     * 新增商户审核日志
     * 
     * @param userExMerchantAuditLog 商户审核日志
     * @return 结果
     */
    public int insertUserExMerchantAuditLog(UserExMerchantAuditLog userExMerchantAuditLog);

    /**
     * 修改商户审核日志
     * 
     * @param userExMerchantAuditLog 商户审核日志
     * @return 结果
     */
    public int updateUserExMerchantAuditLog(UserExMerchantAuditLog userExMerchantAuditLog);

    /**
     * 批量删除商户审核日志
     * 
     * @param ids 需要删除的商户审核日志主键集合
     * @return 结果
     */
    public int deleteUserExMerchantAuditLogByIds(Long[] ids);

    /**
     * 删除商户审核日志信息
     * 
     * @param id 商户审核日志主键
     * @return 结果
     */
    public int deleteUserExMerchantAuditLogById(Long id);
}
