/*
 * Decompiled with CFR 0.152.
 * 
 * Could not load the following classes:
 *  com.ruoyi.common.core.controller.BaseController
 *  com.ruoyi.common.core.domain.AjaxResult
 *  com.ruoyi.framework.web.service.SysLoginService
 *  org.springframework.beans.factory.annotation.Autowired
 *  org.springframework.web.bind.annotation.PostMapping
 *  org.springframework.web.bind.annotation.RestController
 */
package com.ruoyi.web.controller.system;

import com.ruoyi.common.core.controller.BaseController;
import com.ruoyi.common.core.domain.AjaxResult;
import com.ruoyi.framework.web.service.SysLoginService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
public class MyExamController
extends BaseController {
    @Autowired
    private SysLoginService loginService;

    @PostMapping(value={"/test"})
    public AjaxResult login() {
        AjaxResult ajax = AjaxResult.success();
        ajax.put("data", (Object)"\u8bbf\u95ee\u6210\u529f");
        return ajax;
    }
}
