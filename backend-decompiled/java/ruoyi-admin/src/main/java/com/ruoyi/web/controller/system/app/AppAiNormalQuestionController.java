/*
 * Decompiled with CFR 0.152.
 * 
 * Could not load the following classes:
 *  com.ruoyi.common.core.controller.BaseController
 *  com.ruoyi.common.core.domain.AjaxResult
 *  com.ruoyi.system.domain.AiNormalQuestion
 *  com.ruoyi.system.service.IAiNormalQuestionService
 *  org.springframework.beans.factory.annotation.Autowired
 *  org.springframework.security.access.prepost.PreAuthorize
 *  org.springframework.web.bind.annotation.GetMapping
 *  org.springframework.web.bind.annotation.RequestMapping
 *  org.springframework.web.bind.annotation.RestController
 */
package com.ruoyi.web.controller.system.app;

import com.ruoyi.common.core.controller.BaseController;
import com.ruoyi.common.core.domain.AjaxResult;
import com.ruoyi.system.domain.AiNormalQuestion;
import com.ruoyi.system.service.IAiNormalQuestionService;
import java.util.List;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping(value={"/app/aiQuestion"})
public class AppAiNormalQuestionController
extends BaseController {
    @Autowired
    private IAiNormalQuestionService aiNormalQuestionService;

    @PreAuthorize(value="@ss.hasPermi('system:role:client')")
    @GetMapping(value={"/list"})
    public AjaxResult list(AiNormalQuestion aiNormalQuestion) {
        List list = this.aiNormalQuestionService.selectAiNormalQuestionList(aiNormalQuestion);
        AjaxResult ajaxResult = AjaxResult.success();
        ajaxResult.put("data", (Object)list);
        ajaxResult.put("len", (Object)(!list.isEmpty() ? list.size() : 0));
        return ajaxResult;
    }
}
