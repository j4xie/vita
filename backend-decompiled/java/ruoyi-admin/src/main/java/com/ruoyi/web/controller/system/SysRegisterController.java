/*
 * Decompiled with CFR 0.152.
 * 
 * Could not load the following classes:
 *  com.ruoyi.common.core.controller.BaseController
 *  com.ruoyi.common.core.domain.AjaxResult
 *  com.ruoyi.common.core.domain.model.RegisterBody
 *  com.ruoyi.common.utils.StringUtils
 *  com.ruoyi.framework.web.service.SysRegisterService
 *  com.ruoyi.system.service.ISysConfigService
 *  org.springframework.beans.factory.annotation.Autowired
 *  org.springframework.web.bind.annotation.PostMapping
 *  org.springframework.web.bind.annotation.RequestBody
 *  org.springframework.web.bind.annotation.RestController
 */
package com.ruoyi.web.controller.system;

import com.ruoyi.common.core.controller.BaseController;
import com.ruoyi.common.core.domain.AjaxResult;
import com.ruoyi.common.core.domain.model.RegisterBody;
import com.ruoyi.common.utils.StringUtils;
import com.ruoyi.framework.web.service.SysRegisterService;
import com.ruoyi.system.service.ISysConfigService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RestController;

@RestController
public class SysRegisterController
extends BaseController {
    @Autowired
    private SysRegisterService registerService;
    @Autowired
    private ISysConfigService configService;

    @PostMapping(value={"/register"})
    public AjaxResult register(@RequestBody RegisterBody user) {
        if (!"true".equals(this.configService.selectConfigByKey("sys.account.registerUser"))) {
            return this.error("\u5f53\u524d\u7cfb\u7edf\u6ca1\u6709\u5f00\u542f\u6ce8\u518c\u529f\u80fd\uff01");
        }
        String msg = this.registerService.register(user);
        return StringUtils.isEmpty((String)msg) ? this.success() : this.error(msg);
    }
}
