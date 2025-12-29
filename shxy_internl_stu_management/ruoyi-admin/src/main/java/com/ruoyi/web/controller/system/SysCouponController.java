package com.ruoyi.web.controller.system;

import java.util.List;
import javax.servlet.http.HttpServletResponse;

import com.ruoyi.common.core.domain.entity.SysRole;
import com.ruoyi.common.enums.RoleKey;
import com.ruoyi.system.domain.UserExMerchant;
import com.ruoyi.system.service.IUserExMerchantService;
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
import com.ruoyi.system.domain.SysCoupon;
import com.ruoyi.system.service.ISysCouponService;
import com.ruoyi.common.utils.poi.ExcelUtil;
import com.ruoyi.common.core.page.TableDataInfo;

/**
 * 优惠券Controller
 * 
 * @author ruoyi
 * @date 2025-09-17
 */
@RestController
@RequestMapping("/system/coupon")
public class SysCouponController extends BaseController
{
    @Autowired
    private ISysCouponService sysCouponService;

    @Autowired
    IUserExMerchantService  userExMerchantService;

    /**
     * 查询优惠券列表
     */
    @PreAuthorize("@ss.hasPermi('system:coupon:list')")
    @GetMapping("/list")
    public TableDataInfo list(SysCoupon sysCoupon)
    {
        SysRole sysRole = getLoginUser().getUser().getRole();
        if(sysRole.getRoleKey().equals(RoleKey.manage.getValue()) || sysRole.getRoleKey().equals(RoleKey.admin.getValue())){
            //总管理员角色&超级管理员

        }else if(sysRole.getRoleKey().equals(RoleKey.part_manage.getValue())){
            //分管理员角色
            sysCoupon.setCreateByUserId(getUserId());
        }else if(sysRole.getRoleKey().equals(RoleKey.merchant.getValue())){
            //商户角色
            sysCoupon.setCreateByUserId(getUserId());
        }
        startPage();
        List<SysCoupon> list = sysCouponService.selectSysCouponList(sysCoupon);
        return getDataTable(list);
    }

    /**
     * 导出优惠券列表
     */
    @PreAuthorize("@ss.hasPermi('system:coupon:export')")
    @Log(title = "优惠券", businessType = BusinessType.EXPORT)
    @PostMapping("/export")
    public void export(HttpServletResponse response, SysCoupon sysCoupon)
    {
        List<SysCoupon> list = sysCouponService.selectSysCouponList(sysCoupon);
        ExcelUtil<SysCoupon> util = new ExcelUtil<SysCoupon>(SysCoupon.class);
        util.exportExcel(response, list, "优惠券数据");
    }

    /**
     * 获取优惠券详细信息
     */
    @PreAuthorize("@ss.hasPermi('system:coupon:query')")
    @GetMapping(value = "/{id}")
    public AjaxResult getInfo(@PathVariable("id") Long id)
    {
        return success(sysCouponService.selectSysCouponById(id));
    }

    /**
     * 新增优惠券
     */
    @PreAuthorize("@ss.hasPermi('system:coupon:add')")
    @Log(title = "优惠券", businessType = BusinessType.INSERT)
    @PostMapping
    public AjaxResult add(@RequestBody SysCoupon sysCoupon)
    {
        sysCoupon.setCreateByUserId(getUserId());
        SysRole sysRole = getLoginUser().getUser().getRole();
        if(sysRole.getRoleKey().equals(RoleKey.manage.getValue()) || sysRole.getRoleKey().equals(RoleKey.admin.getValue())){
            //总管理员角色&超级管理员
            sysCoupon.setStatus(1L);
            sysCoupon.setCreateByName(getLoginUser().getUser().getLegalName());
            sysCoupon.setSourceFrom(2L);
        }else if(sysRole.getRoleKey().equals(RoleKey.part_manage.getValue())){
            //分管理员角色
            sysCoupon.setStatus(-1L);
            sysCoupon.setCreateByName(getLoginUser().getUser().getLegalName());
            sysCoupon.setSourceFrom(2L);
        }else if(sysRole.getRoleKey().equals(RoleKey.merchant.getValue())){
            //商户角色
            sysCoupon.setStatus(-1L);
            sysCoupon.setSourceFrom(1L);
            //获取商家信息
            UserExMerchant userExMerchant = userExMerchantService.selectUserExMerchantByUserId(getUserId());
            //设置券适用范围
            sysCoupon.setPurpose(2L);
            sysCoupon.setPurposeMerchantUserId(getUserId().toString());
            if(null != userExMerchant){
                sysCoupon.setCreateByName(userExMerchant.getMerchantName());
            }
        }
        return toAjax(sysCouponService.insertSysCoupon(sysCoupon));
    }

    /**
     * 修改优惠券
     */
    @PreAuthorize("@ss.hasPermi('system:coupon:edit')")
    @Log(title = "优惠券", businessType = BusinessType.UPDATE)
    @PutMapping
    public AjaxResult edit(@RequestBody SysCoupon sysCoupon)
    {
        sysCoupon.setCreateByUserId(getUserId());
        SysRole sysRole = getLoginUser().getUser().getRole();
        if(sysRole.getRoleKey().equals(RoleKey.manage.getValue()) || sysRole.getRoleKey().equals(RoleKey.admin.getValue())){
            //总管理员角色&超级管理员
            sysCoupon.setStatus(1L);
            sysCoupon.setCreateByName(getLoginUser().getUser().getLegalName());
            sysCoupon.setSourceFrom(2L);
        }else if(sysRole.getRoleKey().equals(RoleKey.part_manage.getValue())){
            //分管理员角色
            sysCoupon.setStatus(-1L);
            sysCoupon.setCreateByName(getLoginUser().getUser().getLegalName());
            sysCoupon.setSourceFrom(2L);
        }else if(sysRole.getRoleKey().equals(RoleKey.merchant.getValue())){
            //商户角色
            sysCoupon.setStatus(-1L);
            sysCoupon.setSourceFrom(1L);
            //获取商家信息
            /*UserExMerchant userExMerchant = userExMerchantService.selectUserExMerchantByUserId(getUserId());
            if(null != userExMerchant){
                sysCoupon.setCreateByName(userExMerchant.getMerchantName());
            }*/
        }
        return toAjax(sysCouponService.updateSysCoupon(sysCoupon));
    }

    /**
     * 审核
     * @param sysCoupon
     * @return
     */
    @PreAuthorize("@ss.hasPermi('system:coupon:audit')")
    @Log(title = "优惠券", businessType = BusinessType.UPDATE)
    @PostMapping(value = "/audit")
    public AjaxResult audit(@RequestBody SysCoupon sysCoupon)
    {
        return toAjax(sysCouponService.updateSysCoupon(sysCoupon));
    }

    /**
     * 删除优惠券
     */
    @PreAuthorize("@ss.hasPermi('system:coupon:remove')")
    @Log(title = "优惠券", businessType = BusinessType.DELETE)
	@DeleteMapping("/{ids}")
    public AjaxResult remove(@PathVariable Long[] ids)
    {
        return toAjax(sysCouponService.deleteSysCouponByIds(ids));
    }
}
