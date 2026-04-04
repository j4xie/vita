/*
 * Decompiled with CFR 0.152.
 * 
 * Could not load the following classes:
 *  com.ruoyi.common.core.controller.BaseController
 *  com.ruoyi.common.core.page.TableDataInfo
 *  com.ruoyi.system.domain.Organization
 *  com.ruoyi.system.service.IOrganizationService
 *  org.springframework.beans.factory.annotation.Autowired
 *  org.springframework.web.bind.annotation.GetMapping
 *  org.springframework.web.bind.annotation.RequestMapping
 *  org.springframework.web.bind.annotation.RestController
 */
package com.ruoyi.web.controller.system.app;

import com.ruoyi.common.core.controller.BaseController;
import com.ruoyi.common.core.page.TableDataInfo;
import com.ruoyi.system.domain.Organization;
import com.ruoyi.system.service.IOrganizationService;
import java.util.List;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping(value={"/app/organization"})
public class AppOrganizationController
extends BaseController {
    @Autowired
    private IOrganizationService organizationService;

    @GetMapping(value={"/list"})
    public TableDataInfo list(Organization organization) {
        this.startPage();
        List list = this.organizationService.selectOrganizationList(organization);
        return this.getDataTable(list);
    }
}
