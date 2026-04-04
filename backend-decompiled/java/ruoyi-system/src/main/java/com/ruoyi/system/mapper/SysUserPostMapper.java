/*
 * Decompiled with CFR 0.152.
 */
package com.ruoyi.system.mapper;

import com.ruoyi.system.domain.SysUserPost;
import java.util.List;

public interface SysUserPostMapper {
    public int deleteUserPostByUserId(Long var1);

    public int countUserPostById(Long var1);

    public int deleteUserPost(Long[] var1);

    public int batchUserPost(List<SysUserPost> var1);
}

