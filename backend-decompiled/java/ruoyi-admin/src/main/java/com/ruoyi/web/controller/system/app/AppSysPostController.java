/*
 * Decompiled with CFR 0.152.
 * 
 * Could not load the following classes:
 *  com.ruoyi.common.core.controller.BaseController
 *  com.ruoyi.common.core.domain.entity.SysPost
 *  com.ruoyi.common.core.page.TableDataInfo
 *  com.ruoyi.system.service.ISysPostService
 *  org.springframework.beans.factory.annotation.Autowired
 *  org.springframework.web.bind.annotation.GetMapping
 *  org.springframework.web.bind.annotation.RequestMapping
 *  org.springframework.web.bind.annotation.RestController
 */
package com.ruoyi.web.controller.system.app;

import com.ruoyi.common.core.controller.BaseController;
import com.ruoyi.common.core.domain.entity.SysPost;
import com.ruoyi.common.core.page.TableDataInfo;
import com.ruoyi.system.service.ISysPostService;
import java.util.List;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping(value={"/app/post"})
public class AppSysPostController
extends BaseController {
    @Autowired
    private ISysPostService postService;

    @GetMapping(value={"/list"})
    public TableDataInfo list(SysPost post) {
        this.startPage();
        List list = this.postService.selectPostList(post);
        return this.getDataTable(list);
    }
}
