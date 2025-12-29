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
import com.ruoyi.system.domain.CouponVerifyLog;
import com.ruoyi.system.service.ICouponVerifyLogService;
import com.ruoyi.common.utils.poi.ExcelUtil;
import com.ruoyi.common.core.page.TableDataInfo;

/**
 * 券核销记录Controller
 * 
 * @author ruoyi
 * @date 2025-10-22
 */
@RestController
@RequestMapping("/system/couponVerifyLog")
public class CouponVerifyLogController extends BaseController
{
    @Autowired
    private ICouponVerifyLogService couponVerifyLogService;

    /**
     * 查询券核销记录列表
     */
    @PreAuthorize("@ss.hasPermi('system:couponVerifyLog:list')")
    @GetMapping("/list")
    public TableDataInfo list(CouponVerifyLog couponVerifyLog)
    {
        startPage();
        List<CouponVerifyLog> list = couponVerifyLogService.selectCouponVerifyLogList(couponVerifyLog);
        return getDataTable(list);
    }

    /**
     * 导出券核销记录列表
     */
    @PreAuthorize("@ss.hasPermi('system:couponVerifyLog:export')")
    @Log(title = "券核销记录", businessType = BusinessType.EXPORT)
    @PostMapping("/export")
    public void export(HttpServletResponse response, CouponVerifyLog couponVerifyLog)
    {
        List<CouponVerifyLog> list = couponVerifyLogService.selectCouponVerifyLogList(couponVerifyLog);
        ExcelUtil<CouponVerifyLog> util = new ExcelUtil<CouponVerifyLog>(CouponVerifyLog.class);
        util.exportExcel(response, list, "券核销记录数据");
    }

    /**
     * 获取券核销记录详细信息
     */
    @PreAuthorize("@ss.hasPermi('system:couponVerifyLog:query')")
    @GetMapping(value = "/{id}")
    public AjaxResult getInfo(@PathVariable("id") Long id)
    {
        return success(couponVerifyLogService.selectCouponVerifyLogById(id));
    }

    /**
     * 新增券核销记录
     */
    @PreAuthorize("@ss.hasPermi('system:couponVerifyLog:add')")
    @Log(title = "券核销记录", businessType = BusinessType.INSERT)
    @PostMapping
    public AjaxResult add(@RequestBody CouponVerifyLog couponVerifyLog)
    {
        return toAjax(couponVerifyLogService.insertCouponVerifyLog(couponVerifyLog));
    }

    /**
     * 修改券核销记录
     */
    @PreAuthorize("@ss.hasPermi('system:couponVerifyLog:edit')")
    @Log(title = "券核销记录", businessType = BusinessType.UPDATE)
    @PutMapping
    public AjaxResult edit(@RequestBody CouponVerifyLog couponVerifyLog)
    {
        return toAjax(couponVerifyLogService.updateCouponVerifyLog(couponVerifyLog));
    }

    /**
     * 删除券核销记录
     */
    @PreAuthorize("@ss.hasPermi('system:couponVerifyLog:remove')")
    @Log(title = "券核销记录", businessType = BusinessType.DELETE)
	@DeleteMapping("/{ids}")
    public AjaxResult remove(@PathVariable Long[] ids)
    {
        return toAjax(couponVerifyLogService.deleteCouponVerifyLogByIds(ids));
    }
}
