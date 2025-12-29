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
import com.ruoyi.system.domain.MallPointGoods;
import com.ruoyi.system.service.IMallPointGoodsService;
import com.ruoyi.common.utils.poi.ExcelUtil;
import com.ruoyi.common.core.page.TableDataInfo;

/**
 * 积分商品Controller
 * 
 * @author ruoyi
 * @date 2025-09-15
 */
@RestController
@RequestMapping("/system/goods")
public class MallPointGoodsController extends BaseController
{
    @Autowired
    private IMallPointGoodsService mallPointGoodsService;

    /**
     * 查询积分商品列表
     */
    @PreAuthorize("@ss.hasPermi('system:goods:list')")
    @GetMapping("/list")
    public TableDataInfo list(MallPointGoods mallPointGoods)
    {
        startPage();
        List<MallPointGoods> list = mallPointGoodsService.selectMallPointGoodsList(mallPointGoods);
        return getDataTable(list);
    }

    /**
     * 导出积分商品列表
     */
    @PreAuthorize("@ss.hasPermi('system:goods:export')")
    @Log(title = "积分商品", businessType = BusinessType.EXPORT)
    @PostMapping("/export")
    public void export(HttpServletResponse response, MallPointGoods mallPointGoods)
    {
        List<MallPointGoods> list = mallPointGoodsService.selectMallPointGoodsList(mallPointGoods);
        ExcelUtil<MallPointGoods> util = new ExcelUtil<MallPointGoods>(MallPointGoods.class);
        util.exportExcel(response, list, "积分商品数据");
    }

    /**
     * 获取积分商品详细信息
     */
    @PreAuthorize("@ss.hasPermi('system:goods:query')")
    @GetMapping(value = "/{id}")
    public AjaxResult getInfo(@PathVariable("id") Long id)
    {
        return success(mallPointGoodsService.selectMallPointGoodsById(id));
    }

    /**
     * 新增积分商品
     */
    @PreAuthorize("@ss.hasPermi('system:goods:add')")
    @Log(title = "积分商品", businessType = BusinessType.INSERT)
    @PostMapping
    public AjaxResult add(@RequestBody MallPointGoods mallPointGoods)
    {
        mallPointGoods.setCreateUserId(getUserId());
        mallPointGoods.setCreateBy(getLoginUser().getUser().getLegalName());
        return toAjax(mallPointGoodsService.insertMallPointGoods(mallPointGoods));
    }

    /**
     * 修改积分商品
     */
    @PreAuthorize("@ss.hasPermi('system:goods:edit')")
    @Log(title = "积分商品", businessType = BusinessType.UPDATE)
    @PutMapping
    public AjaxResult edit(@RequestBody MallPointGoods mallPointGoods)
    {
        mallPointGoods.setUpdateBy(getLoginUser().getUser().getLegalName());
        return toAjax(mallPointGoodsService.updateMallPointGoods(mallPointGoods));
    }

    /**
     * 删除积分商品
     */
    @PreAuthorize("@ss.hasPermi('system:goods:remove')")
    @Log(title = "积分商品", businessType = BusinessType.DELETE)
	@DeleteMapping("/{ids}")
    public AjaxResult remove(@PathVariable Long[] ids)
    {
        return toAjax(mallPointGoodsService.deleteMallPointGoodsByIds(ids));
    }
}
