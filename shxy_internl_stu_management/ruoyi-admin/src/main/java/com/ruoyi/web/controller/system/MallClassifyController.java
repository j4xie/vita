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
import com.ruoyi.system.domain.MallClassify;
import com.ruoyi.system.service.IMallClassifyService;
import com.ruoyi.common.utils.poi.ExcelUtil;
import com.ruoyi.common.core.page.TableDataInfo;

/**
 * 商品分类Controller
 * 
 * @author ruoyi
 * @date 2025-09-15
 */
@RestController
@RequestMapping("/system/classify")
public class MallClassifyController extends BaseController
{
    @Autowired
    private IMallClassifyService mallClassifyService;

    /**
     * 查询商品分类列表
     */
    @PreAuthorize("@ss.hasPermi('system:classify:list')")
    @GetMapping("/list")
    public TableDataInfo list(MallClassify mallClassify)
    {
        startPage();
        List<MallClassify> list = mallClassifyService.selectMallClassifyList(mallClassify);
        return getDataTable(list);
    }

    /**
     * 导出商品分类列表
     */
    @PreAuthorize("@ss.hasPermi('system:classify:export')")
    @Log(title = "商品分类", businessType = BusinessType.EXPORT)
    @PostMapping("/export")
    public void export(HttpServletResponse response, MallClassify mallClassify)
    {
        List<MallClassify> list = mallClassifyService.selectMallClassifyList(mallClassify);
        ExcelUtil<MallClassify> util = new ExcelUtil<MallClassify>(MallClassify.class);
        util.exportExcel(response, list, "商品分类数据");
    }

    /**
     * 获取商品分类详细信息
     */
    @PreAuthorize("@ss.hasPermi('system:classify:query')")
    @GetMapping(value = "/{id}")
    public AjaxResult getInfo(@PathVariable("id") Long id)
    {
        return success(mallClassifyService.selectMallClassifyById(id));
    }

    /**
     * 新增商品分类
     */
    @PreAuthorize("@ss.hasPermi('system:classify:add')")
    @Log(title = "商品分类", businessType = BusinessType.INSERT)
    @PostMapping
    public AjaxResult add(@RequestBody MallClassify mallClassify)
    {
        return toAjax(mallClassifyService.insertMallClassify(mallClassify));
    }

    /**
     * 修改商品分类
     */
    @PreAuthorize("@ss.hasPermi('system:classify:edit')")
    @Log(title = "商品分类", businessType = BusinessType.UPDATE)
    @PutMapping
    public AjaxResult edit(@RequestBody MallClassify mallClassify)
    {
        return toAjax(mallClassifyService.updateMallClassify(mallClassify));
    }

    /**
     * 删除商品分类
     */
    @PreAuthorize("@ss.hasPermi('system:classify:remove')")
    @Log(title = "商品分类", businessType = BusinessType.DELETE)
	@DeleteMapping("/{ids}")
    public AjaxResult remove(@PathVariable Long[] ids)
    {
        return toAjax(mallClassifyService.deleteMallClassifyByIds(ids));
    }
}
