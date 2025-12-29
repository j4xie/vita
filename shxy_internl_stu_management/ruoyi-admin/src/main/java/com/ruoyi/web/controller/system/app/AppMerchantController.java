package com.ruoyi.web.controller.system.app;

import com.ruoyi.common.core.controller.BaseController;
import com.ruoyi.common.core.domain.AjaxResult;
import com.ruoyi.common.core.domain.entity.SysRole;
import com.ruoyi.common.core.page.TableDataInfo;
import com.ruoyi.common.enums.RoleKey;
import com.ruoyi.system.domain.UserExMerchant;
import com.ruoyi.system.service.ISysUserService;
import com.ruoyi.system.service.IUserExMerchantService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

/**
 * 商户Controller
 *
 * @author ruoyi
 * @date 2025-08-18
 */
@RestController
@RequestMapping("/app/merchant")
public class AppMerchantController  extends BaseController {

    @Autowired
    private IUserExMerchantService userExMerchantService;

    @Autowired
    ISysUserService iSysUserService;

    /**
     * 查询商户列表
     */
    @PreAuthorize("@ss.hasPermi('system:role:client')")
    @GetMapping("/list")
    public TableDataInfo list(UserExMerchant userExMerchant)
    {
        startPage();
        userExMerchant.setStatus(3L);
        List<UserExMerchant> list = userExMerchantService.selectUserExMerchantList(userExMerchant);
        return getDataTable(list);
    }


    /**
     * 查询商户详细信息
     */
    @PreAuthorize("@ss.hasPermi('system:role:client')")
    @GetMapping(value = "/detail")
    public AjaxResult getInfo(Long id)
    {
        return success(userExMerchantService.selectUserExMerchantById(id));
    }

}
