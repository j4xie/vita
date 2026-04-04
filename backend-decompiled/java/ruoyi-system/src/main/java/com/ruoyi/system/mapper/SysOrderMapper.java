/*
 * Decompiled with CFR 0.152.
 */
package com.ruoyi.system.mapper;

import com.ruoyi.system.domain.SysOrder;
import java.util.List;

public interface SysOrderMapper {
    public SysOrder selectSysOrderById(Long var1);

    public SysOrder selectSysOrderByOrderNo(String var1);

    public List<SysOrder> selectSysOrderList(SysOrder var1);

    public int insertSysOrder(SysOrder var1);

    public int updateSysOrder(SysOrder var1);

    public int deleteSysOrderById(Long var1);

    public int deleteSysOrderByIds(Long[] var1);
}

