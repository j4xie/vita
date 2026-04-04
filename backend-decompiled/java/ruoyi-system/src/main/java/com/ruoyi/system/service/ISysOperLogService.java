/*
 * Decompiled with CFR 0.152.
 */
package com.ruoyi.system.service;

import com.ruoyi.system.domain.SysOperLog;
import java.util.List;

public interface ISysOperLogService {
    public void insertOperlog(SysOperLog var1);

    public List<SysOperLog> selectOperLogList(SysOperLog var1);

    public int deleteOperLogByIds(Long[] var1);

    public SysOperLog selectOperLogById(Long var1);

    public void cleanOperLog();
}

