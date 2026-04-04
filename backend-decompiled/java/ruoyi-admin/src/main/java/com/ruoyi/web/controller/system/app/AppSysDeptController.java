/*
 * Decompiled with CFR 0.152.
 * 
 * Could not load the following classes:
 *  com.ruoyi.common.core.controller.BaseController
 *  com.ruoyi.common.core.domain.AjaxResult
 *  com.ruoyi.common.core.domain.entity.SysDept
 *  com.ruoyi.system.service.ISysDeptService
 *  org.springframework.beans.factory.annotation.Autowired
 *  org.springframework.web.bind.annotation.GetMapping
 *  org.springframework.web.bind.annotation.RequestMapping
 *  org.springframework.web.bind.annotation.RestController
 */
package com.ruoyi.web.controller.system.app;

import com.ruoyi.common.core.controller.BaseController;
import com.ruoyi.common.core.domain.AjaxResult;
import com.ruoyi.common.core.domain.entity.SysDept;
import com.ruoyi.system.service.ISysDeptService;
import java.util.ArrayList;
import java.util.List;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping(value={"/app/dept"})
public class AppSysDeptController
extends BaseController {
    @Autowired
    private ISysDeptService deptService;

    @GetMapping(value={"/list"})
    public AjaxResult list(SysDept dept) {
        List depts = this.deptService.selectDeptListForApp(dept);
        ArrayList<SysDept> deptVo = new ArrayList<SysDept>();
        if (!depts.isEmpty() && depts.size() > 0) {
            for (int i = 0; i < depts.size(); ++i) {
                if (((SysDept)depts.get(i)).getParentId() == 1L) {
                    deptVo.add((SysDept)depts.get(i));
                    continue;
                }
                for (int j = 0; j < deptVo.size(); ++j) {
                    if (!((SysDept)depts.get(i)).getParentId().equals(((SysDept)deptVo.get(j)).getDeptId())) continue;
                    ((SysDept)deptVo.get(j)).getChildren().add((SysDept)depts.get(i));
                }
            }
        }
        return this.success(deptVo);
    }
}
