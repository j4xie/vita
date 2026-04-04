/*
 * Decompiled with CFR 0.152.
 * 
 * Could not load the following classes:
 *  org.springframework.beans.factory.annotation.Autowired
 *  org.springframework.data.redis.core.BoundSetOperations
 *  org.springframework.data.redis.core.HashOperations
 *  org.springframework.data.redis.core.RedisTemplate
 *  org.springframework.data.redis.core.ValueOperations
 *  org.springframework.stereotype.Component
 */
package com.ruoyi.common.core.redis;

import java.util.Collection;
import java.util.Iterator;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.concurrent.TimeUnit;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.redis.core.BoundSetOperations;
import org.springframework.data.redis.core.HashOperations;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.data.redis.core.ValueOperations;
import org.springframework.stereotype.Component;

@Component
public class RedisCache {
    @Autowired
    public RedisTemplate redisTemplate;

    public <T> void setCacheObject(String key, T value) {
        this.redisTemplate.opsForValue().set((Object)key, value);
    }

    public <T> void setCacheObject(String key, T value, Integer timeout, TimeUnit timeUnit) {
        this.redisTemplate.opsForValue().set((Object)key, value, (long)timeout.intValue(), timeUnit);
    }

    public boolean expire(String key, long timeout) {
        return this.expire(key, timeout, TimeUnit.SECONDS);
    }

    public boolean expire(String key, long timeout, TimeUnit unit) {
        return this.redisTemplate.expire((Object)key, timeout, unit);
    }

    public long getExpire(String key) {
        return this.redisTemplate.getExpire((Object)key);
    }

    public Boolean hasKey(String key) {
        return this.redisTemplate.hasKey((Object)key);
    }

    public <T> T getCacheObject(String key) {
        ValueOperations operation = this.redisTemplate.opsForValue();
        return (T)operation.get((Object)key);
    }

    public boolean deleteObject(String key) {
        return this.redisTemplate.delete((Object)key);
    }

    public boolean deleteObject(Collection collection) {
        return this.redisTemplate.delete(collection) > 0L;
    }

    public <T> long setCacheList(String key, List<T> dataList) {
        Long count = this.redisTemplate.opsForList().rightPushAll((Object)key, dataList);
        return count == null ? 0L : count;
    }

    public <T> List<T> getCacheList(String key) {
        return this.redisTemplate.opsForList().range((Object)key, 0L, -1L);
    }

    public <T> BoundSetOperations<String, T> setCacheSet(String key, Set<T> dataSet) {
        BoundSetOperations setOperation = this.redisTemplate.boundSetOps((Object)key);
        Iterator<T> it = dataSet.iterator();
        while (it.hasNext()) {
            setOperation.add(new Object[]{it.next()});
        }
        return setOperation;
    }

    public <T> Set<T> getCacheSet(String key) {
        return this.redisTemplate.opsForSet().members((Object)key);
    }

    public <T> void setCacheMap(String key, Map<String, T> dataMap) {
        if (dataMap != null) {
            this.redisTemplate.opsForHash().putAll((Object)key, dataMap);
        }
    }

    public <T> Map<String, T> getCacheMap(String key) {
        return this.redisTemplate.opsForHash().entries((Object)key);
    }

    public <T> void setCacheMapValue(String key, String hKey, T value) {
        this.redisTemplate.opsForHash().put((Object)key, (Object)hKey, value);
    }

    public <T> T getCacheMapValue(String key, String hKey) {
        HashOperations opsForHash = this.redisTemplate.opsForHash();
        return (T)opsForHash.get((Object)key, (Object)hKey);
    }

    public <T> List<T> getMultiCacheMapValue(String key, Collection<Object> hKeys) {
        return this.redisTemplate.opsForHash().multiGet((Object)key, hKeys);
    }

    public boolean deleteCacheMapValue(String key, String hKey) {
        return this.redisTemplate.opsForHash().delete((Object)key, new Object[]{hKey}) > 0L;
    }

    public Collection<String> keys(String pattern) {
        return this.redisTemplate.keys((Object)pattern);
    }
}

