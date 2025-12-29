package com.ruoyi.web.controller.system;


import com.ruoyi.common.constant.Constants;
import com.ruoyi.common.core.controller.BaseController;
import com.ruoyi.common.core.domain.AjaxResult;
import com.ruoyi.common.core.domain.model.LoginBody;
import com.ruoyi.framework.web.service.SysLoginService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RestController;

//测试用接口
@RestController
public class MyExamController extends BaseController {

    @Autowired
    private SysLoginService loginService;

    @PostMapping("/test")
    public AjaxResult login()
    {
        AjaxResult ajax = AjaxResult.success();
        ajax.put("data", "访问成功");
        return ajax;
    }

}
