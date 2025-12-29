package com.ruoyi.system.mapper;

import java.util.List;
import com.ruoyi.system.domain.SysUserAddress;

/**
 * 收货地址Mapper接口
 * 
 * @author ruoyi
 * @date 2025-10-11
 */
public interface SysUserAddressMapper 
{
    /**
     * 查询收货地址
     * 
     * @param id 收货地址主键
     * @return 收货地址
     */
    public SysUserAddress selectSysUserAddressById(Long id);

    /**
     * 查询收货地址列表
     * 
     * @param sysUserAddress 收货地址
     * @return 收货地址集合
     */
    public List<SysUserAddress> selectSysUserAddressList(SysUserAddress sysUserAddress);

    /**
     * 新增收货地址
     * 
     * @param sysUserAddress 收货地址
     * @return 结果
     */
    public int insertSysUserAddress(SysUserAddress sysUserAddress);

    /**
     * 修改收货地址
     * 
     * @param sysUserAddress 收货地址
     * @return 结果
     */
    public int updateSysUserAddress(SysUserAddress sysUserAddress);

    /**
     * 删除收货地址
     * 
     * @param id 收货地址主键
     * @return 结果
     */
    public int deleteSysUserAddressById(Long id);


    /**
     * 把用户其他收货地址都更新为非默认收货地址
     *
     * @return 结果
     */
    public int updateAddressToUnDefault(Long createById);
    /**
     * 批量删除收货地址
     * 
     * @param ids 需要删除的数据主键集合
     * @return 结果
     */
    public int deleteSysUserAddressByIds(Long[] ids);
}
