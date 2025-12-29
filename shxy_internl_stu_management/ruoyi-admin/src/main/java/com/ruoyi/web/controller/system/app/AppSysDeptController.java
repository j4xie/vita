package com.ruoyi.web.controller.system.app;

import com.ruoyi.common.annotation.Log;
import com.ruoyi.common.constant.UserConstants;
import com.ruoyi.common.core.controller.BaseController;
import com.ruoyi.common.core.domain.AjaxResult;
import com.ruoyi.common.core.domain.entity.SysDept;
import com.ruoyi.common.enums.BusinessType;
import com.ruoyi.common.utils.StringUtils;
import com.ruoyi.system.service.ISysDeptService;
import org.apache.commons.lang3.ArrayUtils;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.*;

import java.util.ArrayList;
import java.util.List;

/**
 * 部门信息
 * 
 * @author ruoyi
 */
@RestController
@RequestMapping("/app/dept")
public class AppSysDeptController extends BaseController
{
    @Autowired
    private ISysDeptService deptService;

    /**
     * 获取部门列表
     */
    @GetMapping("/list")
    public AjaxResult list(SysDept dept)
    {
        List<SysDept> depts = deptService.selectDeptListForApp(dept);
        //层级处理
        List<SysDept> deptVo = new ArrayList<SysDept>();
        if(!depts.isEmpty() && depts.size() > 0){
            for(int i = 0;i < depts.size(); i++){
                if(depts.get(i).getParentId() == 1){
                    deptVo.add(depts.get(i));
                }else{
                    for(int j = 0; j < deptVo.size(); j++){
                        if(depts.get(i).getParentId().equals(deptVo.get(j).getDeptId())) {
                            deptVo.get(j).getChildren().add(depts.get(i));
                        }
                    }
                }
            }
        }

        return success(deptVo);
    }

}
