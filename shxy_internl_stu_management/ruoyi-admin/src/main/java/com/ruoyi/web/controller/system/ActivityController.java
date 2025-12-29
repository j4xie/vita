package com.ruoyi.web.controller.system;

import java.util.List;
import javax.servlet.http.HttpServletResponse;

import com.ruoyi.system.domain.ActivityExUser;
import com.ruoyi.system.domain.ActivityModel;
import com.ruoyi.system.domain.vo.ActivityExUserVo;
import com.ruoyi.system.service.IActivityExUserService;
import com.ruoyi.system.service.IActivityModelService;
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
import com.ruoyi.system.domain.Activity;
import com.ruoyi.system.service.IActivityService;
import com.ruoyi.common.utils.poi.ExcelUtil;
import com.ruoyi.common.core.page.TableDataInfo;

/**
 * 活动Controller
 * 
 * @author ruoyi
 * @date 2025-08-13
 */
@RestController
@RequestMapping("/system/activity")
public class ActivityController extends BaseController
{
    @Autowired
    private IActivityService activityService;

    @Autowired
    private IActivityExUserService activityExUserService;

    @Autowired
    private IActivityModelService iActivityModelService;

    /**
     * 查询活动列表
     */
    @PreAuthorize("@ss.hasPermi('system:activity:list')")
    @GetMapping("/list")
    public TableDataInfo list(Activity activity)
    {
        startPage();
        List<Activity> list = activityService.selectActivityList(activity);
        return getDataTable(list);
    }

    /**
     * 导出活动列表
     */
    @PreAuthorize("@ss.hasPermi('system:activity:export')")
    @Log(title = "活动", businessType = BusinessType.EXPORT)
    @PostMapping("/export")
    public void export(HttpServletResponse response, Activity activity)
    {
        List<Activity> list = activityService.selectActivityList(activity);
        ExcelUtil<Activity> util = new ExcelUtil<Activity>(Activity.class);
        util.exportExcel(response, list, "活动数据");
    }

    /**
     * 获取活动详细信息
     */
    @PreAuthorize("@ss.hasPermi('system:activity:query')")
    @GetMapping(value = "/{id}")
    public AjaxResult getInfo(@PathVariable("id") Long id)
    {
        return success(activityService.selectActivityById(id));
    }

    /**
     * 新增活动
     */
    @PreAuthorize("@ss.hasPermi('system:activity:add')")
    @Log(title = "活动", businessType = BusinessType.INSERT)
    @PostMapping
    public AjaxResult add(@RequestBody Activity activity)
    {
        activity.setCreateUserId(getUserId());
        activity.setCreateName(getLoginUser().getUser().getLegalName());
        activity.setCreateNickName(getLoginUser().getUser().getNickName());
        if(null != activity.getModelId()){
            ActivityModel activityModel = iActivityModelService.selectActivityModelById(activity.getModelId());
            if(null != activityModel){
                activity.setModelContent(activityModel.getContent());
                activity.setModelName(activityModel.getName());
            }
        }
        return toAjax(activityService.insertActivity(activity));
    }

    /**
     * 修改活动
     */
    @PreAuthorize("@ss.hasPermi('system:activity:edit')")
    @Log(title = "活动", businessType = BusinessType.UPDATE)
    @PutMapping
    public AjaxResult edit(@RequestBody Activity activity)
    {
        if(null != activity.getModelId()){
            ActivityModel activityModel = iActivityModelService.selectActivityModelById(activity.getModelId());
            if(null != activityModel){
                activity.setModelContent(activityModel.getContent());
                activity.setModelName(activityModel.getName());
            }
        }
        return toAjax(activityService.updateActivity(activity));
    }

    /**
     * 删除活动
     */
    @PreAuthorize("@ss.hasPermi('system:activity:remove')")
    @Log(title = "活动", businessType = BusinessType.DELETE)
	@DeleteMapping("/{ids}")
    public AjaxResult remove(@PathVariable Long[] ids)
    {
        return toAjax(activityService.deleteActivityByIds(ids));
    }


    /**
     * 查询活动报名列表
     */
    @PreAuthorize("@ss.hasPermi('system:actExUser:query')")
    @GetMapping("/actSignList")
    public TableDataInfo actSignList(ActivityExUser activityExUser)
    {
        startPage();
        List<ActivityExUserVo> list = activityExUserService.selectActivityExUserVoList(activityExUser);
        return getDataTable(list);
    }
}
