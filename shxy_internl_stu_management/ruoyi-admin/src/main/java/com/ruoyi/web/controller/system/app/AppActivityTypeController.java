package com.ruoyi.web.controller.system.app;

import com.ruoyi.common.annotation.Log;
import com.ruoyi.common.core.controller.BaseController;
import com.ruoyi.common.core.domain.AjaxResult;
import com.ruoyi.common.core.page.TableDataInfo;
import com.ruoyi.common.enums.BusinessType;
import com.ruoyi.common.utils.poi.ExcelUtil;
import com.ruoyi.system.domain.ActivityType;
import com.ruoyi.system.service.IActivityTypeService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import javax.servlet.http.HttpServletResponse;
import java.util.List;

/**
 * 活动类型Controller--app
 * 
 * @author ruoyi
 * @date 2026-03-16
 */
@RestController
@RequestMapping("/app/actType")
public class AppActivityTypeController extends BaseController
{
    @Autowired
    private IActivityTypeService activityTypeService;


    /**
     * 查询全部活动类型列表
     */
    @PreAuthorize("@ss.hasPermi('system:role:client')")
    @PostMapping("/allList")
    public TableDataInfo allList(ActivityType activityType)
    {
        List<ActivityType> list = activityTypeService.selectActivityTypeList(activityType);
        return getDataTable(list);
    }

}
