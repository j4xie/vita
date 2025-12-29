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
import com.ruoyi.system.domain.UserExMerchantAuditLog;
import com.ruoyi.system.service.IUserExMerchantAuditLogService;
import com.ruoyi.common.utils.poi.ExcelUtil;
import com.ruoyi.common.core.page.TableDataInfo;

/**
 * 商户审核日志Controller
 * 
 * @author ruoyi
 * @date 2025-09-16
 */
@RestController
@RequestMapping("/system/log")
public class UserExMerchantAuditLogController extends BaseController
{
    @Autowired
    private IUserExMerchantAuditLogService userExMerchantAuditLogService;

    /**
     * 查询商户审核日志列表
     */
    @PreAuthorize("@ss.hasPermi('system:log:list')")
    @GetMapping("/list")
    public TableDataInfo list(UserExMerchantAuditLog userExMerchantAuditLog)
    {
        startPage();
        List<UserExMerchantAuditLog> list = userExMerchantAuditLogService.selectUserExMerchantAuditLogList(userExMerchantAuditLog);
        return getDataTable(list);
    }

    /**
     * 导出商户审核日志列表
     */
    @PreAuthorize("@ss.hasPermi('system:log:export')")
    @Log(title = "商户审核日志", businessType = BusinessType.EXPORT)
    @PostMapping("/export")
    public void export(HttpServletResponse response, UserExMerchantAuditLog userExMerchantAuditLog)
    {
        List<UserExMerchantAuditLog> list = userExMerchantAuditLogService.selectUserExMerchantAuditLogList(userExMerchantAuditLog);
        ExcelUtil<UserExMerchantAuditLog> util = new ExcelUtil<UserExMerchantAuditLog>(UserExMerchantAuditLog.class);
        util.exportExcel(response, list, "商户审核日志数据");
    }

    /**
     * 获取商户审核日志详细信息
     */
    @PreAuthorize("@ss.hasPermi('system:log:query')")
    @GetMapping(value = "/{id}")
    public AjaxResult getInfo(@PathVariable("id") Long id)
    {
        return success(userExMerchantAuditLogService.selectUserExMerchantAuditLogById(id));
    }

    /**
     * 新增商户审核日志
     */
    @PreAuthorize("@ss.hasPermi('system:log:add')")
    @Log(title = "商户审核日志", businessType = BusinessType.INSERT)
    @PostMapping
    public AjaxResult add(@RequestBody UserExMerchantAuditLog userExMerchantAuditLog)
    {
        return toAjax(userExMerchantAuditLogService.insertUserExMerchantAuditLog(userExMerchantAuditLog));
    }

    /**
     * 修改商户审核日志
     */
    @PreAuthorize("@ss.hasPermi('system:log:edit')")
    @Log(title = "商户审核日志", businessType = BusinessType.UPDATE)
    @PutMapping
    public AjaxResult edit(@RequestBody UserExMerchantAuditLog userExMerchantAuditLog)
    {
        return toAjax(userExMerchantAuditLogService.updateUserExMerchantAuditLog(userExMerchantAuditLog));
    }

    /**
     * 删除商户审核日志
     */
    @PreAuthorize("@ss.hasPermi('system:log:remove')")
    @Log(title = "商户审核日志", businessType = BusinessType.DELETE)
	@DeleteMapping("/{ids}")
    public AjaxResult remove(@PathVariable Long[] ids)
    {
        return toAjax(userExMerchantAuditLogService.deleteUserExMerchantAuditLogByIds(ids));
    }
}
