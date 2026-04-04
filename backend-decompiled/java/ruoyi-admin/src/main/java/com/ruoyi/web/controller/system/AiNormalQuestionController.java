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
 *  com.ruoyi.system.domain.AiNormalQuestion
 *  com.ruoyi.system.service.IAiNormalQuestionService
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
import com.ruoyi.system.domain.AiNormalQuestion;
import com.ruoyi.system.service.IAiNormalQuestionService;
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
@RequestMapping(value={"/system/question"})
public class AiNormalQuestionController
extends BaseController {
    @Autowired
    private IAiNormalQuestionService aiNormalQuestionService;

    @PreAuthorize(value="@ss.hasPermi('system:question:list')")
    @GetMapping(value={"/list"})
    public TableDataInfo list(AiNormalQuestion aiNormalQuestion) {
        this.startPage();
        List list = this.aiNormalQuestionService.selectAiNormalQuestionList(aiNormalQuestion);
        return this.getDataTable(list);
    }

    @PreAuthorize(value="@ss.hasPermi('system:question:export')")
    @Log(title="AI\u5e38\u7528\u95ee\u9898", businessType=BusinessType.EXPORT)
    @PostMapping(value={"/export"})
    public void export(HttpServletResponse response, AiNormalQuestion aiNormalQuestion) {
        List list = this.aiNormalQuestionService.selectAiNormalQuestionList(aiNormalQuestion);
        ExcelUtil util = new ExcelUtil(AiNormalQuestion.class);
        util.exportExcel(response, list, "AI\u5e38\u7528\u95ee\u9898\u6570\u636e");
    }

    @PreAuthorize(value="@ss.hasPermi('system:question:query')")
    @GetMapping(value={"/{id}"})
    public AjaxResult getInfo(@PathVariable(value="id") Long id) {
        return this.success(this.aiNormalQuestionService.selectAiNormalQuestionById(id));
    }

    @PreAuthorize(value="@ss.hasPermi('system:question:add')")
    @Log(title="AI\u5e38\u7528\u95ee\u9898", businessType=BusinessType.INSERT)
    @PostMapping
    public AjaxResult add(@RequestBody AiNormalQuestion aiNormalQuestion) {
        aiNormalQuestion.setCreateById(this.getUserId());
        aiNormalQuestion.setCreateByName(this.getLoginUser().getUser().getLegalName());
        return this.toAjax(this.aiNormalQuestionService.insertAiNormalQuestion(aiNormalQuestion));
    }

    @PreAuthorize(value="@ss.hasPermi('system:question:edit')")
    @Log(title="AI\u5e38\u7528\u95ee\u9898", businessType=BusinessType.UPDATE)
    @PutMapping
    public AjaxResult edit(@RequestBody AiNormalQuestion aiNormalQuestion) {
        return this.toAjax(this.aiNormalQuestionService.updateAiNormalQuestion(aiNormalQuestion));
    }

    @PreAuthorize(value="@ss.hasPermi('system:question:remove')")
    @Log(title="AI\u5e38\u7528\u95ee\u9898", businessType=BusinessType.DELETE)
    @DeleteMapping(value={"/{ids}"})
    public AjaxResult remove(@PathVariable Long[] ids) {
        return this.toAjax(this.aiNormalQuestionService.deleteAiNormalQuestionByIds(ids));
    }
}
