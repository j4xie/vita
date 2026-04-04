/*
 * Decompiled with CFR 0.152.
 */
package com.ruoyi.common.core.domain;

import com.ruoyi.common.utils.StringUtils;
import java.util.HashMap;
import java.util.Objects;

public class AjaxResult
extends HashMap<String, Object> {
    private static final long serialVersionUID = 1L;
    public static final String CODE_TAG = "code";
    public static final String MSG_TAG = "msg";
    public static final String DATA_TAG = "data";

    public AjaxResult() {
    }

    public AjaxResult(int code, String msg) {
        super.put(CODE_TAG, code);
        super.put(MSG_TAG, msg);
    }

    public AjaxResult(int code, String msg, Object data) {
        super.put(CODE_TAG, code);
        super.put(MSG_TAG, msg);
        if (StringUtils.isNotNull(data)) {
            super.put(DATA_TAG, data);
        }
    }

    public static AjaxResult success() {
        return AjaxResult.success("\u64cd\u4f5c\u6210\u529f");
    }

    public static AjaxResult success(Object data) {
        return AjaxResult.success("\u64cd\u4f5c\u6210\u529f", data);
    }

    public static AjaxResult success(String msg) {
        return AjaxResult.success(msg, null);
    }

    public static AjaxResult success(String msg, Object data) {
        return new AjaxResult(200, msg, data);
    }

    public static AjaxResult warn(String msg) {
        return AjaxResult.warn(msg, null);
    }

    public static AjaxResult warn(String msg, Object data) {
        return new AjaxResult(601, msg, data);
    }

    public static AjaxResult error() {
        return AjaxResult.error("\u64cd\u4f5c\u5931\u8d25");
    }

    public static AjaxResult error(String msg) {
        return AjaxResult.error(msg, null);
    }

    public static AjaxResult error(String msg, Object data) {
        return new AjaxResult(500, msg, data);
    }

    public static AjaxResult error(int code, String msg) {
        return new AjaxResult(code, msg, null);
    }

    public boolean isSuccess() {
        return Objects.equals(200, this.get(CODE_TAG));
    }

    public boolean isWarn() {
        return Objects.equals(601, this.get(CODE_TAG));
    }

    public boolean isError() {
        return Objects.equals(500, this.get(CODE_TAG));
    }

    @Override
    public AjaxResult put(String key, Object value) {
        super.put(key, value);
        return this;
    }
}

