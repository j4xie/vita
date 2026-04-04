/*
 * Decompiled with CFR 0.152.
 * 
 * Could not load the following classes:
 *  org.springframework.beans.factory.annotation.Autowired
 *  org.springframework.stereotype.Service
 */
package com.ruoyi.system.service.impl;

import com.ruoyi.system.domain.SysUserAddress;
import com.ruoyi.system.mapper.SysUserAddressMapper;
import com.ruoyi.system.service.ISysUserAddressService;
import java.util.List;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

@Service
public class SysUserAddressServiceImpl
implements ISysUserAddressService {
    @Autowired
    private SysUserAddressMapper sysUserAddressMapper;

    @Override
    public SysUserAddress selectSysUserAddressById(Long id) {
        return this.sysUserAddressMapper.selectSysUserAddressById(id);
    }

    @Override
    public List<SysUserAddress> selectSysUserAddressList(SysUserAddress sysUserAddress) {
        return this.sysUserAddressMapper.selectSysUserAddressList(sysUserAddress);
    }

    @Override
    public int insertSysUserAddress(SysUserAddress sysUserAddress) {
        if (sysUserAddress.getIsDefault() == 1L) {
            this.sysUserAddressMapper.updateAddressToUnDefault(sysUserAddress.getCreateById());
        }
        return this.sysUserAddressMapper.insertSysUserAddress(sysUserAddress);
    }

    @Override
    public int updateSysUserAddress(SysUserAddress sysUserAddress) {
        if (sysUserAddress.getIsDefault() == 1L) {
            this.sysUserAddressMapper.updateAddressToUnDefault(sysUserAddress.getCreateById());
        }
        return this.sysUserAddressMapper.updateSysUserAddress(sysUserAddress);
    }

    @Override
    public int deleteSysUserAddressByIds(Long[] ids) {
        return this.sysUserAddressMapper.deleteSysUserAddressByIds(ids);
    }

    @Override
    public int deleteSysUserAddressById(Long id) {
        return this.sysUserAddressMapper.deleteSysUserAddressById(id);
    }
}

