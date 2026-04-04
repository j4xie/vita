/*
 * Decompiled with CFR 0.152.
 * 
 * Could not load the following classes:
 *  com.alibaba.fastjson2.JSONArray
 *  com.alibaba.fastjson2.JSONReader$Feature
 */
package com.ruoyi.common.utils;

import com.alibaba.fastjson2.JSONArray;
import com.alibaba.fastjson2.JSONReader;
import com.ruoyi.common.core.domain.entity.SysDictData;
import com.ruoyi.common.core.redis.RedisCache;
import com.ruoyi.common.utils.StringUtils;
import com.ruoyi.common.utils.spring.SpringUtils;
import java.util.Collection;
import java.util.List;

public class DictUtils {
    public static final String SEPARATOR = ",";

    public static void setDictCache(String key, List<SysDictData> dictDatas) {
        SpringUtils.getBean(RedisCache.class).setCacheObject(DictUtils.getCacheKey(key), dictDatas);
    }

    public static List<SysDictData> getDictCache(String key) {
        JSONArray arrayCache = (JSONArray)SpringUtils.getBean(RedisCache.class).getCacheObject(DictUtils.getCacheKey(key));
        if (StringUtils.isNotNull(arrayCache)) {
            return arrayCache.toList(SysDictData.class, new JSONReader.Feature[0]);
        }
        return null;
    }

    public static String getDictLabel(String dictType, String dictValue) {
        if (StringUtils.isEmpty(dictValue)) {
            return "";
        }
        return DictUtils.getDictLabel(dictType, dictValue, SEPARATOR);
    }

    public static String getDictValue(String dictType, String dictLabel) {
        if (StringUtils.isEmpty(dictLabel)) {
            return "";
        }
        return DictUtils.getDictValue(dictType, dictLabel, SEPARATOR);
    }

    public static String getDictLabel(String dictType, String dictValue, String separator) {
        StringBuilder propertyString = new StringBuilder();
        List<SysDictData> datas = DictUtils.getDictCache(dictType);
        if (StringUtils.isNull(datas)) {
            return "";
        }
        if (StringUtils.containsAny((CharSequence)separator, (CharSequence)dictValue)) {
            block0: for (SysDictData dict : datas) {
                for (String value : dictValue.split(separator)) {
                    if (!value.equals(dict.getDictValue())) continue;
                    propertyString.append(dict.getDictLabel()).append(separator);
                    continue block0;
                }
            }
        } else {
            for (SysDictData dict : datas) {
                if (!dictValue.equals(dict.getDictValue())) continue;
                return dict.getDictLabel();
            }
        }
        return StringUtils.stripEnd((String)propertyString.toString(), (String)separator);
    }

    public static String getDictValue(String dictType, String dictLabel, String separator) {
        StringBuilder propertyString = new StringBuilder();
        List<SysDictData> datas = DictUtils.getDictCache(dictType);
        if (StringUtils.isNull(datas)) {
            return "";
        }
        if (StringUtils.containsAny((CharSequence)separator, (CharSequence)dictLabel)) {
            block0: for (SysDictData dict : datas) {
                for (String label : dictLabel.split(separator)) {
                    if (!label.equals(dict.getDictLabel())) continue;
                    propertyString.append(dict.getDictValue()).append(separator);
                    continue block0;
                }
            }
        } else {
            for (SysDictData dict : datas) {
                if (!dictLabel.equals(dict.getDictLabel())) continue;
                return dict.getDictValue();
            }
        }
        return StringUtils.stripEnd((String)propertyString.toString(), (String)separator);
    }

    public static String getDictValues(String dictType) {
        StringBuilder propertyString = new StringBuilder();
        List<SysDictData> datas = DictUtils.getDictCache(dictType);
        if (StringUtils.isNull(datas)) {
            return "";
        }
        for (SysDictData dict : datas) {
            propertyString.append(dict.getDictValue()).append(SEPARATOR);
        }
        return StringUtils.stripEnd((String)propertyString.toString(), (String)SEPARATOR);
    }

    public static String getDictLabels(String dictType) {
        StringBuilder propertyString = new StringBuilder();
        List<SysDictData> datas = DictUtils.getDictCache(dictType);
        if (StringUtils.isNull(datas)) {
            return "";
        }
        for (SysDictData dict : datas) {
            propertyString.append(dict.getDictLabel()).append(SEPARATOR);
        }
        return StringUtils.stripEnd((String)propertyString.toString(), (String)SEPARATOR);
    }

    public static void removeDictCache(String key) {
        SpringUtils.getBean(RedisCache.class).deleteObject(DictUtils.getCacheKey(key));
    }

    public static void clearDictCache() {
        Collection<String> keys = SpringUtils.getBean(RedisCache.class).keys("sys_dict:*");
        SpringUtils.getBean(RedisCache.class).deleteObject(keys);
    }

    public static String getCacheKey(String configKey) {
        return "sys_dict:" + configKey;
    }
}

