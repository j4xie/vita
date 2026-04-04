/*
 * Decompiled with CFR 0.152.
 * 
 * Could not load the following classes:
 *  com.ruoyi.common.core.domain.entity.SysPost
 */
package com.ruoyi.system.service;

import com.ruoyi.common.core.domain.entity.SysPost;
import java.util.List;

public interface ISysPostService {
    public List<SysPost> selectPostList(SysPost var1);

    public List<SysPost> selectPostAll();

    public SysPost selectPostById(Long var1);

    public List<Long> selectPostListByUserId(Long var1);

    public Long selectPostIdByUserId(Long var1);

    public boolean checkPostNameUnique(SysPost var1);

    public boolean checkPostCodeUnique(SysPost var1);

    public int countUserPostById(Long var1);

    public int deletePostById(Long var1);

    public int deletePostByIds(Long[] var1);

    public int insertPost(SysPost var1);

    public int updatePost(SysPost var1);
}

