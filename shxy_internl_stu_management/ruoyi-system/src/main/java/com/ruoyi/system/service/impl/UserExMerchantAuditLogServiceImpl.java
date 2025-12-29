package com.ruoyi.system.service.impl;

import java.util.List;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import com.ruoyi.system.mapper.UserExMerchantAuditLogMapper;
import com.ruoyi.system.domain.UserExMerchantAuditLog;
import com.ruoyi.system.service.IUserExMerchantAuditLogService;

/**
 * 商户审核日志Service业务层处理
 * 
 * @author ruoyi
 * @date 2025-09-16
 */
@Service
public class UserExMerchantAuditLogServiceImpl implements IUserExMerchantAuditLogService 
{
    @Autowired
    private UserExMerchantAuditLogMapper userExMerchantAuditLogMapper;

    /**
     * 查询商户审核日志
     * 
     * @param id 商户审核日志主键
     * @return 商户审核日志
     */
    @Override
    public UserExMerchantAuditLog selectUserExMerchantAuditLogById(Long id)
    {
        return userExMerchantAuditLogMapper.selectUserExMerchantAuditLogById(id);
    }

    /**
     * 查询商户审核日志列表
     * 
     * @param userExMerchantAuditLog 商户审核日志
     * @return 商户审核日志
     */
    @Override
    public List<UserExMerchantAuditLog> selectUserExMerchantAuditLogList(UserExMerchantAuditLog userExMerchantAuditLog)
    {
        return userExMerchantAuditLogMapper.selectUserExMerchantAuditLogList(userExMerchantAuditLog);
    }

    /**
     * 新增商户审核日志
     * 
     * @param userExMerchantAuditLog 商户审核日志
     * @return 结果
     */
    @Override
    public int insertUserExMerchantAuditLog(UserExMerchantAuditLog userExMerchantAuditLog)
    {
        return userExMerchantAuditLogMapper.insertUserExMerchantAuditLog(userExMerchantAuditLog);
    }

    /**
     * 修改商户审核日志
     * 
     * @param userExMerchantAuditLog 商户审核日志
     * @return 结果
     */
    @Override
    public int updateUserExMerchantAuditLog(UserExMerchantAuditLog userExMerchantAuditLog)
    {
        return userExMerchantAuditLogMapper.updateUserExMerchantAuditLog(userExMerchantAuditLog);
    }

    /**
     * 批量删除商户审核日志
     * 
     * @param ids 需要删除的商户审核日志主键
     * @return 结果
     */
    @Override
    public int deleteUserExMerchantAuditLogByIds(Long[] ids)
    {
        return userExMerchantAuditLogMapper.deleteUserExMerchantAuditLogByIds(ids);
    }

    /**
     * 删除商户审核日志信息
     * 
     * @param id 商户审核日志主键
     * @return 结果
     */
    @Override
    public int deleteUserExMerchantAuditLogById(Long id)
    {
        return userExMerchantAuditLogMapper.deleteUserExMerchantAuditLogById(id);
    }
}
