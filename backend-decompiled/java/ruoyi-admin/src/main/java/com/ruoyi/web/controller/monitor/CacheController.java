/*
 * Decompiled with CFR 0.152.
 * 
 * Could not load the following classes:
 *  com.ruoyi.common.core.domain.AjaxResult
 *  com.ruoyi.common.utils.StringUtils
 *  com.ruoyi.system.domain.SysCache
 *  org.springframework.beans.factory.annotation.Autowired
 *  org.springframework.data.redis.core.RedisTemplate
 *  org.springframework.security.access.prepost.PreAuthorize
 *  org.springframework.web.bind.annotation.DeleteMapping
 *  org.springframework.web.bind.annotation.GetMapping
 *  org.springframework.web.bind.annotation.PathVariable
 *  org.springframework.web.bind.annotation.RequestMapping
 *  org.springframework.web.bind.annotation.RestController
 */
package com.ruoyi.web.controller.monitor;

import com.ruoyi.common.core.domain.AjaxResult;
import com.ruoyi.common.utils.StringUtils;
import com.ruoyi.system.domain.SysCache;
import java.util.ArrayList;
import java.util.Collection;
import java.util.HashMap;
import java.util.List;
import java.util.Properties;
import java.util.Set;
import java.util.TreeSet;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping(value={"/monitor/cache"})
public class CacheController {
    @Autowired
    private RedisTemplate<String, String> redisTemplate;
    private static final List<SysCache> caches = new ArrayList<SysCache>();

    public CacheController() {
        caches.add(new SysCache("login_tokens:", "\u7528\u6237\u4fe1\u606f"));
        caches.add(new SysCache("sys_config:", "\u914d\u7f6e\u4fe1\u606f"));
        caches.add(new SysCache("sys_dict:", "\u6570\u636e\u5b57\u5178"));
        caches.add(new SysCache("captcha_codes:", "\u9a8c\u8bc1\u7801"));
        caches.add(new SysCache("repeat_submit:", "\u9632\u91cd\u63d0\u4ea4"));
        caches.add(new SysCache("rate_limit:", "\u9650\u6d41\u5904\u7406"));
        caches.add(new SysCache("pwd_err_cnt:", "\u5bc6\u7801\u9519\u8bef\u6b21\u6570"));
    }

    @PreAuthorize(value="@ss.hasPermi('monitor:cache:list')")
    @GetMapping
    public AjaxResult getInfo() throws Exception {
        Properties info = (Properties)this.redisTemplate.execute(connection -> connection.info());
        Properties commandStats = (Properties)this.redisTemplate.execute(connection -> connection.info("commandstats"));
        Object dbSize = this.redisTemplate.execute(connection -> connection.dbSize());
        HashMap<String, Object> result = new HashMap<String, Object>(3);
        result.put("info", info);
        result.put("dbSize", dbSize);
        ArrayList pieList = new ArrayList();
        commandStats.stringPropertyNames().forEach(key -> {
            HashMap<String, String> data = new HashMap<String, String>(2);
            String property = commandStats.getProperty((String)key);
            data.put("name", StringUtils.removeStart((String)key, (String)"cmdstat_"));
            data.put("value", StringUtils.substringBetween((String)property, (String)"calls=", (String)",usec"));
            pieList.add(data);
        });
        result.put("commandStats", pieList);
        return AjaxResult.success(result);
    }

    @PreAuthorize(value="@ss.hasPermi('monitor:cache:list')")
    @GetMapping(value={"/getNames"})
    public AjaxResult cache() {
        return AjaxResult.success(caches);
    }

    @PreAuthorize(value="@ss.hasPermi('monitor:cache:list')")
    @GetMapping(value={"/getKeys/{cacheName}"})
    public AjaxResult getCacheKeys(@PathVariable String cacheName) {
        Set cacheKeys = this.redisTemplate.keys((Object)(cacheName + "*"));
        return AjaxResult.success(new TreeSet(cacheKeys));
    }

    @PreAuthorize(value="@ss.hasPermi('monitor:cache:list')")
    @GetMapping(value={"/getValue/{cacheName}/{cacheKey}"})
    public AjaxResult getCacheValue(@PathVariable String cacheName, @PathVariable String cacheKey) {
        String cacheValue = (String)this.redisTemplate.opsForValue().get((Object)cacheKey);
        SysCache sysCache = new SysCache(cacheName, cacheKey, cacheValue);
        return AjaxResult.success((Object)sysCache);
    }

    @PreAuthorize(value="@ss.hasPermi('monitor:cache:list')")
    @DeleteMapping(value={"/clearCacheName/{cacheName}"})
    public AjaxResult clearCacheName(@PathVariable String cacheName) {
        Set cacheKeys = this.redisTemplate.keys((Object)(cacheName + "*"));
        this.redisTemplate.delete((Collection)cacheKeys);
        return AjaxResult.success();
    }

    @PreAuthorize(value="@ss.hasPermi('monitor:cache:list')")
    @DeleteMapping(value={"/clearCacheKey/{cacheKey}"})
    public AjaxResult clearCacheKey(@PathVariable String cacheKey) {
        this.redisTemplate.delete((Object)cacheKey);
        return AjaxResult.success();
    }

    @PreAuthorize(value="@ss.hasPermi('monitor:cache:list')")
    @DeleteMapping(value={"/clearCacheAll"})
    public AjaxResult clearCacheAll() {
        Set cacheKeys = this.redisTemplate.keys((Object)"*");
        this.redisTemplate.delete((Collection)cacheKeys);
        return AjaxResult.success();
    }
}
