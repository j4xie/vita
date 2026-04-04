/*
 * Decompiled with CFR 0.152.
 */
package com.ruoyi.system.service;

import com.ruoyi.system.domain.SysUserAddress;
import java.util.List;

public interface ISysUserAddressService {
    public SysUserAddress selectSysUserAddressById(Long var1);

    public List<SysUserAddress> selectSysUserAddressList(SysUserAddress var1);

    public int insertSysUserAddress(SysUserAddress var1);

    public int updateSysUserAddress(SysUserAddress var1);

    public int deleteSysUserAddressByIds(Long[] var1);

    public int deleteSysUserAddressById(Long var1);
}

