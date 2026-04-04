/*
 * Decompiled with CFR 0.152.
 * 
 * Could not load the following classes:
 *  org.springframework.beans.factory.annotation.Autowired
 *  org.springframework.stereotype.Service
 */
package com.ruoyi.system.service.impl;

import com.ruoyi.system.domain.SysOperLog;
import com.ruoyi.system.mapper.SysOperLogMapper;
import com.ruoyi.system.service.ISysOperLogService;
import java.util.List;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

@Service
public class SysOperLogServiceImpl
implements ISysOperLogService {
    @Autowired
    private SysOperLogMapper operLogMapper;

    @Override
    public void insertOperlog(SysOperLog operLog) {
        this.operLogMapper.insertOperlog(operLog);
    }

    @Override
    public List<SysOperLog> selectOperLogList(SysOperLog operLog) {
        return this.operLogMapper.selectOperLogList(operLog);
    }

    @Override
    public int deleteOperLogByIds(Long[] operIds) {
        return this.operLogMapper.deleteOperLogByIds(operIds);
    }

    @Override
    public SysOperLog selectOperLogById(Long operId) {
        return this.operLogMapper.selectOperLogById(operId);
    }

    @Override
    public void cleanOperLog() {
        this.operLogMapper.cleanOperLog();
    }
}

