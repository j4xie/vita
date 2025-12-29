package com.ruoyi.web.controller.system;

import java.util.List;
import javax.servlet.http.HttpServletResponse;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import com.ruoyi.common.annotation.Log;
import com.ruoyi.common.core.controller.BaseController;
import com.ruoyi.common.core.domain.AjaxResult;
import com.ruoyi.common.enums.BusinessType;
import com.ruoyi.system.domain.AiNormalQuestion;
import com.ruoyi.system.service.IAiNormalQuestionService;
import com.ruoyi.common.utils.poi.ExcelUtil;
import com.ruoyi.common.core.page.TableDataInfo;

/**
 * AI常用问题Controller
 * 
 * @author ruoyi
 * @date 2025-10-17
 */
@RestController
@RequestMapping("/system/question")
public class AiNormalQuestionController extends BaseController
{
    @Autowired
    private IAiNormalQuestionService aiNormalQuestionService;

    /**
     * 查询AI常用问题列表
     */
    @PreAuthorize("@ss.hasPermi('system:question:list')")
    @GetMapping("/list")
    public TableDataInfo list(AiNormalQuestion aiNormalQuestion)
    {
        startPage();
        List<AiNormalQuestion> list = aiNormalQuestionService.selectAiNormalQuestionList(aiNormalQuestion);
        return getDataTable(list);
    }

    /**
     * 导出AI常用问题列表
     */
    @PreAuthorize("@ss.hasPermi('system:question:export')")
    @Log(title = "AI常用问题", businessType = BusinessType.EXPORT)
    @PostMapping("/export")
    public void export(HttpServletResponse response, AiNormalQuestion aiNormalQuestion)
    {
        List<AiNormalQuestion> list = aiNormalQuestionService.selectAiNormalQuestionList(aiNormalQuestion);
        ExcelUtil<AiNormalQuestion> util = new ExcelUtil<AiNormalQuestion>(AiNormalQuestion.class);
        util.exportExcel(response, list, "AI常用问题数据");
    }

    /**
     * 获取AI常用问题详细信息
     */
    @PreAuthorize("@ss.hasPermi('system:question:query')")
    @GetMapping(value = "/{id}")
    public AjaxResult getInfo(@PathVariable("id") Long id)
    {
        return success(aiNormalQuestionService.selectAiNormalQuestionById(id));
    }

    /**
     * 新增AI常用问题
     */
    @PreAuthorize("@ss.hasPermi('system:question:add')")
    @Log(title = "AI常用问题", businessType = BusinessType.INSERT)
    @PostMapping
    public AjaxResult add(@RequestBody AiNormalQuestion aiNormalQuestion)
    {
        aiNormalQuestion.setCreateById(getUserId());
        aiNormalQuestion.setCreateByName(getLoginUser().getUser().getLegalName());
        return toAjax(aiNormalQuestionService.insertAiNormalQuestion(aiNormalQuestion));
    }

    /**
     * 修改AI常用问题
     */
    @PreAuthorize("@ss.hasPermi('system:question:edit')")
    @Log(title = "AI常用问题", businessType = BusinessType.UPDATE)
    @PutMapping
    public AjaxResult edit(@RequestBody AiNormalQuestion aiNormalQuestion)
    {
        return toAjax(aiNormalQuestionService.updateAiNormalQuestion(aiNormalQuestion));
    }

    /**
     * 删除AI常用问题
     */
    @PreAuthorize("@ss.hasPermi('system:question:remove')")
    @Log(title = "AI常用问题", businessType = BusinessType.DELETE)
	@DeleteMapping("/{ids}")
    public AjaxResult remove(@PathVariable Long[] ids)
    {
        return toAjax(aiNormalQuestionService.deleteAiNormalQuestionByIds(ids));
    }
}
