/*
 * Decompiled with CFR 0.152.
 */
package com.ruoyi.system.service;

import com.ruoyi.system.domain.SysConfig;
import java.util.List;

public interface ISysConfigService {
    public SysConfig selectConfigById(Long var1);

    public String selectConfigByKey(String var1);

    public boolean selectCaptchaEnabled();

    public List<SysConfig> selectConfigList(SysConfig var1);

    public int insertConfig(SysConfig var1);

    public int updateConfig(SysConfig var1);

    public void deleteConfigByIds(Long[] var1);

    public void loadingConfigCache();

    public void clearConfigCache();

    public void resetConfigCache();

    public boolean checkConfigKeyUnique(SysConfig var1);
}

