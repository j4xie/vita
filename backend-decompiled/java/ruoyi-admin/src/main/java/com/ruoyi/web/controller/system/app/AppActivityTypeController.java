/*
 * Decompiled with CFR 0.152.
 * 
 * Could not load the following classes:
 *  com.ruoyi.common.core.controller.BaseController
 *  com.ruoyi.common.core.page.TableDataInfo
 *  com.ruoyi.system.domain.ActivityType
 *  com.ruoyi.system.service.IActivityTypeService
 *  org.springframework.beans.factory.annotation.Autowired
 *  org.springframework.security.access.prepost.PreAuthorize
 *  org.springframework.web.bind.annotation.PostMapping
 *  org.springframework.web.bind.annotation.RequestMapping
 *  org.springframework.web.bind.annotation.RestController
 */
package com.ruoyi.web.controller.system.app;

import com.ruoyi.common.core.controller.BaseController;
import com.ruoyi.common.core.page.TableDataInfo;
import com.ruoyi.system.domain.ActivityType;
import com.ruoyi.system.service.IActivityTypeService;
import java.util.List;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping(value={"/app/actType"})
public class AppActivityTypeController
extends BaseController {
    @Autowired
    private IActivityTypeService activityTypeService;

    @PreAuthorize(value="@ss.hasPermi('system:role:client')")
    @PostMapping(value={"/allList"})
    public TableDataInfo allList(ActivityType activityType) {
        List list = this.activityTypeService.selectActivityTypeList(activityType);
        return this.getDataTable(list);
    }
}
