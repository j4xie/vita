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
import com.ruoyi.system.domain.UserLevelExEquity;
import com.ruoyi.system.service.IUserLevelExEquityService;
import com.ruoyi.common.utils.poi.ExcelUtil;
import com.ruoyi.common.core.page.TableDataInfo;

/**
 * 会员等级关联权益Controller
 * 
 * @author ruoyi
 * @date 2026-01-28
 */
@RestController
@RequestMapping("/system/levelExEquity")
public class UserLevelExEquityController extends BaseController
{
    @Autowired
    private IUserLevelExEquityService userLevelExEquityService;

    /**
     * 查询会员等级关联权益列表
     */
    @PreAuthorize("@ss.hasPermi('system:levelExEquity:list')")
    @GetMapping("/list")
    public TableDataInfo list(UserLevelExEquity userLevelExEquity)
    {
        startPage();
        List<UserLevelExEquity> list = userLevelExEquityService.selectUserLevelExEquityList(userLevelExEquity);
        return getDataTable(list);
    }

    /**
     * 导出会员等级关联权益列表
     */
    @PreAuthorize("@ss.hasPermi('system:levelExEquity:export')")
    @Log(title = "会员等级关联权益", businessType = BusinessType.EXPORT)
    @PostMapping("/export")
    public void export(HttpServletResponse response, UserLevelExEquity userLevelExEquity)
    {
        List<UserLevelExEquity> list = userLevelExEquityService.selectUserLevelExEquityList(userLevelExEquity);
        ExcelUtil<UserLevelExEquity> util = new ExcelUtil<UserLevelExEquity>(UserLevelExEquity.class);
        util.exportExcel(response, list, "会员等级关联权益数据");
    }

    /**
     * 获取会员等级关联权益详细信息
     */
    @PreAuthorize("@ss.hasPermi('system:levelExEquity:query')")
    @GetMapping(value = "/{levelId}")
    public AjaxResult getInfo(@PathVariable("levelId") Long levelId)
    {
        return success(userLevelExEquityService.selectUserLevelExEquityByLevelId(levelId));
    }

    /**
     * 新增会员等级关联权益
     */
    @PreAuthorize("@ss.hasPermi('system:levelExEquity:add')")
    @Log(title = "会员等级关联权益", businessType = BusinessType.INSERT)
    @PostMapping
    public AjaxResult add(@RequestBody UserLevelExEquity userLevelExEquity)
    {
        return toAjax(userLevelExEquityService.insertUserLevelExEquity(userLevelExEquity));
    }

    /**
     * 修改会员等级关联权益
     */
    @PreAuthorize("@ss.hasPermi('system:levelExEquity:edit')")
    @Log(title = "会员等级关联权益", businessType = BusinessType.UPDATE)
    @PutMapping
    public AjaxResult edit(@RequestBody UserLevelExEquity userLevelExEquity)
    {
        return toAjax(userLevelExEquityService.updateUserLevelExEquity(userLevelExEquity));
    }

    /**
     * 删除会员等级关联权益
     */
    @PreAuthorize("@ss.hasPermi('system:levelExEquity:remove')")
    @Log(title = "会员等级关联权益", businessType = BusinessType.DELETE)
	@DeleteMapping("/{levelIds}")
    public AjaxResult remove(@PathVariable Long[] levelIds)
    {
        return toAjax(userLevelExEquityService.deleteUserLevelExEquityByLevelIds(levelIds));
    }
}
