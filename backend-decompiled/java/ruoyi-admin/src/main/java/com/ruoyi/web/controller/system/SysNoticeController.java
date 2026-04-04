/*
 * Decompiled with CFR 0.152.
 * 
 * Could not load the following classes:
 *  com.ruoyi.common.annotation.Log
 *  com.ruoyi.common.core.controller.BaseController
 *  com.ruoyi.common.core.domain.AjaxResult
 *  com.ruoyi.common.core.page.TableDataInfo
 *  com.ruoyi.common.enums.BusinessType
 *  com.ruoyi.system.domain.SysNotice
 *  com.ruoyi.system.service.ISysNoticeService
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
import com.ruoyi.common.core.page.TableDataInfo;
import com.ruoyi.common.enums.BusinessType;
import com.ruoyi.system.domain.SysNotice;
import com.ruoyi.system.service.ISysNoticeService;
import java.util.List;
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
@RequestMapping(value={"/system/notice"})
public class SysNoticeController
extends BaseController {
    @Autowired
    private ISysNoticeService noticeService;

    @PreAuthorize(value="@ss.hasPermi('system:notice:list')")
    @GetMapping(value={"/list"})
    public TableDataInfo list(SysNotice notice) {
        this.startPage();
        List list = this.noticeService.selectNoticeList(notice);
        return this.getDataTable(list);
    }

    @PreAuthorize(value="@ss.hasPermi('system:notice:query')")
    @GetMapping(value={"/{noticeId}"})
    public AjaxResult getInfo(@PathVariable Long noticeId) {
        return this.success(this.noticeService.selectNoticeById(noticeId));
    }

    @PreAuthorize(value="@ss.hasPermi('system:notice:add')")
    @Log(title="\u901a\u77e5\u516c\u544a", businessType=BusinessType.INSERT)
    @PostMapping
    public AjaxResult add(@Validated @RequestBody SysNotice notice) {
        notice.setCreateBy(this.getUsername());
        return this.toAjax(this.noticeService.insertNotice(notice));
    }

    @PreAuthorize(value="@ss.hasPermi('system:notice:edit')")
    @Log(title="\u901a\u77e5\u516c\u544a", businessType=BusinessType.UPDATE)
    @PutMapping
    public AjaxResult edit(@Validated @RequestBody SysNotice notice) {
        notice.setUpdateBy(this.getUsername());
        return this.toAjax(this.noticeService.updateNotice(notice));
    }

    @PreAuthorize(value="@ss.hasPermi('system:notice:remove')")
    @Log(title="\u901a\u77e5\u516c\u544a", businessType=BusinessType.DELETE)
    @DeleteMapping(value={"/{noticeIds}"})
    public AjaxResult remove(@PathVariable Long[] noticeIds) {
        return this.toAjax(this.noticeService.deleteNoticeByIds(noticeIds));
    }
}
