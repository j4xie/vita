/*
 * Decompiled with CFR 0.152.
 * 
 * Could not load the following classes:
 *  com.ruoyi.common.core.domain.AjaxResult
 *  com.ruoyi.framework.web.domain.Server
 *  org.springframework.security.access.prepost.PreAuthorize
 *  org.springframework.web.bind.annotation.GetMapping
 *  org.springframework.web.bind.annotation.RequestMapping
 *  org.springframework.web.bind.annotation.RestController
 */
package com.ruoyi.web.controller.monitor;

import com.ruoyi.common.core.domain.AjaxResult;
import com.ruoyi.framework.web.domain.Server;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping(value={"/monitor/server"})
public class ServerController {
    @PreAuthorize(value="@ss.hasPermi('monitor:server:list')")
    @GetMapping
    public AjaxResult getInfo() throws Exception {
        Server server = new Server();
        server.copyTo();
        return AjaxResult.success((Object)server);
    }
}
