/*
 * Decompiled with CFR 0.152.
 * 
 * Could not load the following classes:
 *  com.ruoyi.common.core.controller.BaseController
 *  com.ruoyi.common.core.domain.AjaxResult
 *  com.ruoyi.common.core.page.TableDataInfo
 *  com.ruoyi.system.domain.UserExMerchant
 *  com.ruoyi.system.service.ISysUserService
 *  com.ruoyi.system.service.IUserExMerchantService
 *  org.springframework.beans.factory.annotation.Autowired
 *  org.springframework.security.access.prepost.PreAuthorize
 *  org.springframework.web.bind.annotation.GetMapping
 *  org.springframework.web.bind.annotation.RequestMapping
 *  org.springframework.web.bind.annotation.RestController
 */
package com.ruoyi.web.controller.system.app;

import com.ruoyi.common.core.controller.BaseController;
import com.ruoyi.common.core.domain.AjaxResult;
import com.ruoyi.common.core.page.TableDataInfo;
import com.ruoyi.system.domain.UserExMerchant;
import com.ruoyi.system.service.ISysUserService;
import com.ruoyi.system.service.IUserExMerchantService;
import java.util.List;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping(value={"/app/merchant"})
public class AppMerchantController
extends BaseController {
    @Autowired
    private IUserExMerchantService userExMerchantService;
    @Autowired
    ISysUserService iSysUserService;

    @PreAuthorize(value="@ss.hasPermi('system:role:client')")
    @GetMapping(value={"/list"})
    public TableDataInfo list(UserExMerchant userExMerchant) {
        this.startPage();
        userExMerchant.setStatus(Long.valueOf(3L));
        List list = this.userExMerchantService.selectUserExMerchantList(userExMerchant);
        return this.getDataTable(list);
    }

    @PreAuthorize(value="@ss.hasPermi('system:role:client')")
    @GetMapping(value={"/detail"})
    public AjaxResult getInfo(Long id) {
        return this.success(this.userExMerchantService.selectUserExMerchantById(id));
    }
}
