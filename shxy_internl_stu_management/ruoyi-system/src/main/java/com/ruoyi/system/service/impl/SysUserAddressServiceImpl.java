package com.ruoyi.system.service.impl;

import java.util.List;
import com.ruoyi.common.utils.DateUtils;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import com.ruoyi.system.mapper.SysUserAddressMapper;
import com.ruoyi.system.domain.SysUserAddress;
import com.ruoyi.system.service.ISysUserAddressService;

/**
 * 收货地址Service业务层处理
 * 
 * @author ruoyi
 * @date 2025-10-11
 */
@Service
public class SysUserAddressServiceImpl implements ISysUserAddressService 
{
    @Autowired
    private SysUserAddressMapper sysUserAddressMapper;

    /**
     * 查询收货地址
     * 
     * @param id 收货地址主键
     * @return 收货地址
     */
    @Override
    public SysUserAddress selectSysUserAddressById(Long id)
    {
        return sysUserAddressMapper.selectSysUserAddressById(id);
    }

    /**
     * 查询收货地址列表
     * 
     * @param sysUserAddress 收货地址
     * @return 收货地址
     */
    @Override
    public List<SysUserAddress> selectSysUserAddressList(SysUserAddress sysUserAddress)
    {
        return sysUserAddressMapper.selectSysUserAddressList(sysUserAddress);
    }

    /**
     * 新增收货地址
     * 
     * @param sysUserAddress 收货地址
     * @return 结果
     */
    @Override
    public int insertSysUserAddress(SysUserAddress sysUserAddress)
    {
        //sysUserAddress.setCreateTime(DateUtils.getNowDate());
        if(sysUserAddress.getIsDefault() == 1){
            //将其他的地址全部更新为非默认地址
            sysUserAddressMapper.updateAddressToUnDefault(sysUserAddress.getCreateById());
        }
        return sysUserAddressMapper.insertSysUserAddress(sysUserAddress);
    }

    /**
     * 修改收货地址
     * 
     * @param sysUserAddress 收货地址
     * @return 结果
     */
    @Override
    public int updateSysUserAddress(SysUserAddress sysUserAddress)
    {
        //sysUserAddress.setUpdateTime(DateUtils.getNowDate());
        if(sysUserAddress.getIsDefault() == 1){
            //将其他的地址全部更新为非默认地址
            sysUserAddressMapper.updateAddressToUnDefault(sysUserAddress.getCreateById());
        }
        return sysUserAddressMapper.updateSysUserAddress(sysUserAddress);
    }

    /**
     * 批量删除收货地址
     * 
     * @param ids 需要删除的收货地址主键
     * @return 结果
     */
    @Override
    public int deleteSysUserAddressByIds(Long[] ids)
    {
        return sysUserAddressMapper.deleteSysUserAddressByIds(ids);
    }

    /**
     * 删除收货地址信息
     * 
     * @param id 收货地址主键
     * @return 结果
     */
    @Override
    public int deleteSysUserAddressById(Long id)
    {
        return sysUserAddressMapper.deleteSysUserAddressById(id);
    }
}
