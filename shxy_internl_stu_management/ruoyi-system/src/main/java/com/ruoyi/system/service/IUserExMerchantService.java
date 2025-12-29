package com.ruoyi.system.service;

import java.util.List;
import com.ruoyi.system.domain.UserExMerchant;
import com.ruoyi.system.domain.UserExMerchantAuditLog;

/**
 * 商户Service接口
 * 
 * @author ruoyi
 * @date 2025-09-10
 */
public interface IUserExMerchantService 
{
    /**
     * 查询商户
     * 
     * @param id 商户主键
     * @return 商户
     */
    public UserExMerchant selectUserExMerchantById(Long id);

    /**
     * 查询商户
     *
     * @param userId
     * @return 商户
     */
    public UserExMerchant selectUserExMerchantByUserId(Long userId);

    /**
     * 查询商户列表
     * 
     * @param userExMerchant 商户
     * @return 商户集合
     */
    public List<UserExMerchant> selectUserExMerchantList(UserExMerchant userExMerchant);

    /**
     * 新增商户
     * 
     * @param userExMerchant 商户
     * @return 结果
     */
    public int insertUserExMerchant(UserExMerchant userExMerchant);

    /**
     * 修改商户
     * 
     * @param userExMerchant 商户
     * @return 结果
     */
    public int updateUserExMerchant(UserExMerchant userExMerchant);

    /**
     * 审核商户
     *
     * @param userExMerchant 商户
     * @return 结果
     */
    public int auditUserExMerchant(UserExMerchant userExMerchant, UserExMerchantAuditLog userExMerchantAuditLog);

    /**
     * 批量删除商户
     * 
     * @param ids 需要删除的商户主键集合
     * @return 结果
     */
    public int deleteUserExMerchantByIds(Long[] ids);

    /**
     * 删除商户信息
     * 
     * @param id 商户主键
     * @return 结果
     */
    public int deleteUserExMerchantById(Long id);
}
