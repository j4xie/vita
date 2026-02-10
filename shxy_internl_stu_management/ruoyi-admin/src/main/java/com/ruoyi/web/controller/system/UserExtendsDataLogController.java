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
import com.ruoyi.common.core.domain.entity.UserExtendsDataLog;
import com.ruoyi.system.service.IUserExtendsDataLogService;
import com.ruoyi.common.utils.poi.ExcelUtil;
import com.ruoyi.common.core.page.TableDataInfo;

/**
 * 用户数据积分等记录Controller
 * 
 * @author ruoyi
 * @date 2026-02-04
 */
@RestController
@RequestMapping("/system/userDataLog")
public class UserExtendsDataLogController extends BaseController
{
    @Autowired
    private IUserExtendsDataLogService userExtendsDataLogService;

    /**
     * 查询用户数据积分等记录列表
     */
    @PreAuthorize("@ss.hasPermi('system:log:list')")
    @GetMapping("/list")
    public TableDataInfo list(UserExtendsDataLog userExtendsDataLog)
    {
        startPage();
        List<UserExtendsDataLog> list = userExtendsDataLogService.selectUserExtendsDataLogList(userExtendsDataLog);
        return getDataTable(list);
    }

    /**
     * 导出用户数据积分等记录列表
     */
    @PreAuthorize("@ss.hasPermi('system:log:export')")
    @Log(title = "用户数据积分等记录", businessType = BusinessType.EXPORT)
    @PostMapping("/export")
    public void export(HttpServletResponse response, UserExtendsDataLog userExtendsDataLog)
    {
        List<UserExtendsDataLog> list = userExtendsDataLogService.selectUserExtendsDataLogList(userExtendsDataLog);
        ExcelUtil<UserExtendsDataLog> util = new ExcelUtil<UserExtendsDataLog>(UserExtendsDataLog.class);
        util.exportExcel(response, list, "用户数据积分等记录数据");
    }

    /**
     * 获取用户数据积分等记录详细信息
     */
    @PreAuthorize("@ss.hasPermi('system:log:query')")
    @GetMapping(value = "/{userId}")
    public AjaxResult getInfo(@PathVariable("userId") Long userId)
    {
        return success(userExtendsDataLogService.selectUserExtendsDataLogByUserId(userId));
    }

    /**
     * 新增用户数据积分等记录
     */
    @PreAuthorize("@ss.hasPermi('system:log:add')")
    @Log(title = "用户数据积分等记录", businessType = BusinessType.INSERT)
    @PostMapping
    public AjaxResult add(@RequestBody UserExtendsDataLog userExtendsDataLog)
    {
        return toAjax(userExtendsDataLogService.insertUserExtendsDataLog(userExtendsDataLog));
    }

    /**
     * 修改用户数据积分等记录
     */
    @PreAuthorize("@ss.hasPermi('system:log:edit')")
    @Log(title = "用户数据积分等记录", businessType = BusinessType.UPDATE)
    @PutMapping
    public AjaxResult edit(@RequestBody UserExtendsDataLog userExtendsDataLog)
    {
        return toAjax(userExtendsDataLogService.updateUserExtendsDataLog(userExtendsDataLog));
    }

    /**
     * 删除用户数据积分等记录
     */
    @PreAuthorize("@ss.hasPermi('system:log:remove')")
    @Log(title = "用户数据积分等记录", businessType = BusinessType.DELETE)
	@DeleteMapping("/{userIds}")
    public AjaxResult remove(@PathVariable Long[] userIds)
    {
        return toAjax(userExtendsDataLogService.deleteUserExtendsDataLogByUserIds(userIds));
    }
}
