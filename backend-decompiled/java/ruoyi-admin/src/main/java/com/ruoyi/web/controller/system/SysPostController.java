/*
 * Decompiled with CFR 0.152.
 * 
 * Could not load the following classes:
 *  com.ruoyi.common.annotation.Log
 *  com.ruoyi.common.core.controller.BaseController
 *  com.ruoyi.common.core.domain.AjaxResult
 *  com.ruoyi.common.core.domain.entity.SysPost
 *  com.ruoyi.common.core.page.TableDataInfo
 *  com.ruoyi.common.enums.BusinessType
 *  com.ruoyi.common.utils.poi.ExcelUtil
 *  com.ruoyi.system.service.ISysPostService
 *  javax.servlet.http.HttpServletResponse
 *  org.springframework.beans.factory.annotation.Autowired
 *  org.springframework.security.access.prepost.PreAuthorize
 *  org.springframework.validation.annotation.Validated
 *  org.springframework.web.bind.annotation.DeleteMapping
 *  org.springframework.web.bind.annotation.GetMapping
 *  org.springframework.web.bind.annotation.PathVariable
 *  org.springframework.web.bind.annotation.PostMapping
 *  org.springframework.web.bind.annotation.PutMapping
 *  org.springframework.web.bind.annotation.RequestBody
 *  org.springframework.web.bind.annotation.RequestMapping
 *  org.springframework.web.bind.annotation.RestController
 */
package com.ruoyi.web.controller.system;

import com.ruoyi.common.annotation.Log;
import com.ruoyi.common.core.controller.BaseController;
import com.ruoyi.common.core.domain.AjaxResult;
import com.ruoyi.common.core.domain.entity.SysPost;
import com.ruoyi.common.core.page.TableDataInfo;
import com.ruoyi.common.enums.BusinessType;
import com.ruoyi.common.utils.poi.ExcelUtil;
import com.ruoyi.system.service.ISysPostService;
import java.util.List;
import javax.servlet.http.HttpServletResponse;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping(value={"/system/post"})
public class SysPostController
extends BaseController {
    @Autowired
    private ISysPostService postService;

    @PreAuthorize(value="@ss.hasPermi('system:post:list')")
    @GetMapping(value={"/list"})
    public TableDataInfo list(SysPost post) {
        this.startPage();
        List list = this.postService.selectPostList(post);
        return this.getDataTable(list);
    }

    @Log(title="\u5c97\u4f4d\u7ba1\u7406", businessType=BusinessType.EXPORT)
    @PreAuthorize(value="@ss.hasPermi('system:post:export')")
    @PostMapping(value={"/export"})
    public void export(HttpServletResponse response, SysPost post) {
        List list = this.postService.selectPostList(post);
        ExcelUtil util = new ExcelUtil(SysPost.class);
        util.exportExcel(response, list, "\u5c97\u4f4d\u6570\u636e");
    }

    @PreAuthorize(value="@ss.hasPermi('system:post:query')")
    @GetMapping(value={"/{postId}"})
    public AjaxResult getInfo(@PathVariable Long postId) {
        return this.success(this.postService.selectPostById(postId));
    }

    @PreAuthorize(value="@ss.hasPermi('system:post:add')")
    @Log(title="\u5c97\u4f4d\u7ba1\u7406", businessType=BusinessType.INSERT)
    @PostMapping
    public AjaxResult add(@Validated @RequestBody SysPost post) {
        if (!this.postService.checkPostNameUnique(post)) {
            return this.error("\u65b0\u589e\u5c97\u4f4d'" + post.getPostName() + "'\u5931\u8d25\uff0c\u5c97\u4f4d\u540d\u79f0\u5df2\u5b58\u5728");
        }
        if (!this.postService.checkPostCodeUnique(post)) {
            return this.error("\u65b0\u589e\u5c97\u4f4d'" + post.getPostName() + "'\u5931\u8d25\uff0c\u5c97\u4f4d\u7f16\u7801\u5df2\u5b58\u5728");
        }
        post.setCreateBy(this.getUsername());
        return this.toAjax(this.postService.insertPost(post));
    }

    @PreAuthorize(value="@ss.hasPermi('system:post:edit')")
    @Log(title="\u5c97\u4f4d\u7ba1\u7406", businessType=BusinessType.UPDATE)
    @PutMapping
    public AjaxResult edit(@Validated @RequestBody SysPost post) {
        if (!this.postService.checkPostNameUnique(post)) {
            return this.error("\u4fee\u6539\u5c97\u4f4d'" + post.getPostName() + "'\u5931\u8d25\uff0c\u5c97\u4f4d\u540d\u79f0\u5df2\u5b58\u5728");
        }
        if (!this.postService.checkPostCodeUnique(post)) {
            return this.error("\u4fee\u6539\u5c97\u4f4d'" + post.getPostName() + "'\u5931\u8d25\uff0c\u5c97\u4f4d\u7f16\u7801\u5df2\u5b58\u5728");
        }
        post.setUpdateBy(this.getUsername());
        return this.toAjax(this.postService.updatePost(post));
    }

    @PreAuthorize(value="@ss.hasPermi('system:post:remove')")
    @Log(title="\u5c97\u4f4d\u7ba1\u7406", businessType=BusinessType.DELETE)
    @DeleteMapping(value={"/{postIds}"})
    public AjaxResult remove(@PathVariable Long[] postIds) {
        return this.toAjax(this.postService.deletePostByIds(postIds));
    }

    @GetMapping(value={"/optionselect"})
    public AjaxResult optionselect() {
        List posts = this.postService.selectPostAll();
        return this.success(posts);
    }
}
