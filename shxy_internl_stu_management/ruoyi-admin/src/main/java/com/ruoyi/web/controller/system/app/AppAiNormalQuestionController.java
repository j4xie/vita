package com.ruoyi.web.controller.system.app;

import com.ruoyi.common.annotation.Log;
import com.ruoyi.common.core.controller.BaseController;
import com.ruoyi.common.core.domain.AjaxResult;
import com.ruoyi.common.core.page.TableDataInfo;
import com.ruoyi.common.enums.BusinessType;
import com.ruoyi.common.utils.poi.ExcelUtil;
import com.ruoyi.system.domain.AiNormalQuestion;
import com.ruoyi.system.service.IAiNormalQuestionService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import javax.servlet.http.HttpServletResponse;
import java.util.List;

/**
 * AI常用问题Controller
 * 
 * @author ruoyi
 * @date 2025-10-17
 */
@RestController
@RequestMapping("/app/aiQuestion")
public class AppAiNormalQuestionController extends BaseController
{
    @Autowired
    private IAiNormalQuestionService aiNormalQuestionService;

    /**
     * 查询AI常用问题列表
     */
    @PreAuthorize("@ss.hasPermi('system:role:client')")
    @GetMapping("/list")
    public AjaxResult list(AiNormalQuestion aiNormalQuestion)
    {
        List<AiNormalQuestion> list = aiNormalQuestionService.selectAiNormalQuestionList(aiNormalQuestion);
        AjaxResult ajaxResult = AjaxResult.success();
        ajaxResult.put("data", list);
        ajaxResult.put("len", !list.isEmpty() ? list.size() : 0);
        return ajaxResult;
    }

}
