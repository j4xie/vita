/*
 * Decompiled with CFR 0.152.
 * 
 * Could not load the following classes:
 *  com.ruoyi.common.annotation.Log
 *  com.ruoyi.common.core.controller.BaseController
 *  com.ruoyi.common.core.domain.AjaxResult
 *  com.ruoyi.common.core.page.TableDataInfo
 *  com.ruoyi.common.enums.BusinessType
 *  com.ruoyi.common.utils.poi.ExcelUtil
 *  com.ruoyi.system.domain.UserLevelExEquity
 *  com.ruoyi.system.service.IUserLevelExEquityService
 *  javax.servlet.http.HttpServletResponse
 *  org.springframework.beans.factory.annotation.Autowired
 *  org.springframework.security.access.prepost.PreAuthorize
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
import com.ruoyi.common.utils.poi.ExcelUtil;
import com.ruoyi.system.domain.UserLevelExEquity;
import com.ruoyi.system.service.IUserLevelExEquityService;
import java.util.List;
import javax.servlet.http.HttpServletResponse;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping(value={"/system/levelExEquity"})
public class UserLevelExEquityController
extends BaseController {
    @Autowired
    private IUserLevelExEquityService userLevelExEquityService;

    @PreAuthorize(value="@ss.hasPermi('system:levelExEquity:list')")
    @GetMapping(value={"/list"})
    public TableDataInfo list(UserLevelExEquity userLevelExEquity) {
        this.startPage();
        List list = this.userLevelExEquityService.selectUserLevelExEquityList(userLevelExEquity);
        return this.getDataTable(list);
    }

    @PreAuthorize(value="@ss.hasPermi('system:levelExEquity:export')")
    @Log(title="\u4f1a\u5458\u7b49\u7ea7\u5173\u8054\u6743\u76ca", businessType=BusinessType.EXPORT)
    @PostMapping(value={"/export"})
    public void export(HttpServletResponse response, UserLevelExEquity userLevelExEquity) {
        List list = this.userLevelExEquityService.selectUserLevelExEquityList(userLevelExEquity);
        ExcelUtil util = new ExcelUtil(UserLevelExEquity.class);
        util.exportExcel(response, list, "\u4f1a\u5458\u7b49\u7ea7\u5173\u8054\u6743\u76ca\u6570\u636e");
    }

    @PreAuthorize(value="@ss.hasPermi('system:levelExEquity:query')")
    @GetMapping(value={"/{levelId}"})
    public AjaxResult getInfo(@PathVariable(value="levelId") Long levelId) {
        return this.success(this.userLevelExEquityService.selectUserLevelExEquityByLevelId(levelId));
    }

    @PreAuthorize(value="@ss.hasPermi('system:levelExEquity:add')")
    @Log(title="\u4f1a\u5458\u7b49\u7ea7\u5173\u8054\u6743\u76ca", businessType=BusinessType.INSERT)
    @PostMapping
    public AjaxResult add(@RequestBody UserLevelExEquity userLevelExEquity) {
        return this.toAjax(this.userLevelExEquityService.insertUserLevelExEquity(userLevelExEquity));
    }

    @PreAuthorize(value="@ss.hasPermi('system:levelExEquity:edit')")
    @Log(title="\u4f1a\u5458\u7b49\u7ea7\u5173\u8054\u6743\u76ca", businessType=BusinessType.UPDATE)
    @PutMapping
    public AjaxResult edit(@RequestBody UserLevelExEquity userLevelExEquity) {
        return this.toAjax(this.userLevelExEquityService.updateUserLevelExEquity(userLevelExEquity));
    }

    @PreAuthorize(value="@ss.hasPermi('system:levelExEquity:remove')")
    @Log(title="\u4f1a\u5458\u7b49\u7ea7\u5173\u8054\u6743\u76ca", businessType=BusinessType.DELETE)
    @DeleteMapping(value={"/{levelIds}"})
    public AjaxResult remove(@PathVariable Long[] levelIds) {
        return this.toAjax(this.userLevelExEquityService.deleteUserLevelExEquityByLevelIds(levelIds));
    }
}
