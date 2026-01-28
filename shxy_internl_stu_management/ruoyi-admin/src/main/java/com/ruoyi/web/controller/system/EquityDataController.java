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
import com.ruoyi.system.domain.EquityData;
import com.ruoyi.system.service.IEquityDataService;
import com.ruoyi.common.utils.poi.ExcelUtil;
import com.ruoyi.common.core.page.TableDataInfo;

/**
 * 核心权益管理Controller
 * 
 * @author ruoyi
 * @date 2026-01-28
 */
@RestController
@RequestMapping("/system/equData")
public class EquityDataController extends BaseController
{
    @Autowired
    private IEquityDataService equityDataService;

    /**
     * 查询核心权益管理列表
     */
    @PreAuthorize("@ss.hasPermi('system:equData:list')")
    @GetMapping("/list")
    public TableDataInfo list(EquityData equityData)
    {
        startPage();
        List<EquityData> list = equityDataService.selectEquityDataList(equityData);
        return getDataTable(list);
    }

    /**
     * 导出核心权益管理列表
     */
    @PreAuthorize("@ss.hasPermi('system:equData:export')")
    @Log(title = "核心权益管理", businessType = BusinessType.EXPORT)
    @PostMapping("/export")
    public void export(HttpServletResponse response, EquityData equityData)
    {
        List<EquityData> list = equityDataService.selectEquityDataList(equityData);
        ExcelUtil<EquityData> util = new ExcelUtil<EquityData>(EquityData.class);
        util.exportExcel(response, list, "核心权益管理数据");
    }

    /**
     * 获取核心权益管理详细信息
     */
    @PreAuthorize("@ss.hasPermi('system:equData:query')")
    @GetMapping(value = "/{id}")
    public AjaxResult getInfo(@PathVariable("id") Long id)
    {
        return success(equityDataService.selectEquityDataById(id));
    }

    /**
     * 新增核心权益管理
     */
    @PreAuthorize("@ss.hasPermi('system:equData:add')")
    @Log(title = "核心权益管理", businessType = BusinessType.INSERT)
    @PostMapping
    public AjaxResult add(@RequestBody EquityData equityData)
    {
        EquityData equityDataVo = equityDataService.selectEquityDataByTag(equityData.getEquTag());
        if(null != equityDataVo){
            AjaxResult ajaxResult = AjaxResult.error();
            ajaxResult.put("msg", "权益标识已存在，不能重复");
            return ajaxResult;
        }
        return toAjax(equityDataService.insertEquityData(equityData));
    }

    /**
     * 修改核心权益管理
     */
    @PreAuthorize("@ss.hasPermi('system:equData:edit')")
    @Log(title = "核心权益管理", businessType = BusinessType.UPDATE)
    @PutMapping
    public AjaxResult edit(@RequestBody EquityData equityData)
    {
        EquityData equityDataVo = equityDataService.selectEquityDataByTag(equityData.getEquTag());
        if(null != equityDataVo && !equityData.getId().equals(equityDataVo.getId())){
            AjaxResult ajaxResult = AjaxResult.error();
            ajaxResult.put("msg", "权益标识已存在，不能重复");
            return ajaxResult;
        }
        return toAjax(equityDataService.updateEquityData(equityData));
    }

    /**
     * 删除核心权益管理
     */
    @PreAuthorize("@ss.hasPermi('system:equData:remove')")
    @Log(title = "核心权益管理", businessType = BusinessType.DELETE)
	@DeleteMapping("/{ids}")
    public AjaxResult remove(@PathVariable Long[] ids)
    {
        return toAjax(equityDataService.deleteEquityDataByIds(ids));
    }
}
