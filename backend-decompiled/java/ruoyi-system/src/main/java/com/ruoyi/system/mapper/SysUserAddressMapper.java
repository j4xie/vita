/*
 * Decompiled with CFR 0.152.
 */
package com.ruoyi.system.mapper;

import com.ruoyi.system.domain.SysUserAddress;
import java.util.List;

public interface SysUserAddressMapper {
    public SysUserAddress selectSysUserAddressById(Long var1);

    public List<SysUserAddress> selectSysUserAddressList(SysUserAddress var1);

    public int insertSysUserAddress(SysUserAddress var1);

    public int updateSysUserAddress(SysUserAddress var1);

    public int deleteSysUserAddressById(Long var1);

    public int updateAddressToUnDefault(Long var1);

    public int deleteSysUserAddressByIds(Long[] var1);
}

