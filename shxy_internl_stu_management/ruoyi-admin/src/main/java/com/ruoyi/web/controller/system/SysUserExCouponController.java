package com.ruoyi.web.controller.system;

import java.util.List;
import javax.servlet.http.HttpServletResponse;

import com.ruoyi.system.domain.SysCoupon;
import com.ruoyi.system.service.ISysCouponService;
import org.springframework.beans.BeanUtils;
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
import com.ruoyi.system.domain.SysUserExCoupon;
import com.ruoyi.system.service.ISysUserExCouponService;
import com.ruoyi.common.utils.poi.ExcelUtil;
import com.ruoyi.common.core.page.TableDataInfo;

/**
 * 用户关联优惠券Controller
 * 
 * @author ruoyi
 * @date 2025-09-25
 */
@RestController
@RequestMapping("/system/userExCoupon")
public class SysUserExCouponController extends BaseController
{
    @Autowired
    private ISysUserExCouponService sysUserExCouponService;

    @Autowired
    private ISysCouponService sysCouponService;

    /**
     * 查询用户关联优惠券列表
     */
    @PreAuthorize("@ss.hasPermi('system:coupon:list')")
    @GetMapping("/list")
    public TableDataInfo list(SysUserExCoupon sysUserExCoupon)
    {
        startPage();
        List<SysUserExCoupon> list = sysUserExCouponService.selectSysUserExCouponList(sysUserExCoupon);
        return getDataTable(list);
    }

    /**
     * 导出用户关联优惠券列表
     */
    @PreAuthorize("@ss.hasPermi('system:coupon:export')")
    @Log(title = "用户关联优惠券", businessType = BusinessType.EXPORT)
    @PostMapping("/export")
    public void export(HttpServletResponse response, SysUserExCoupon sysUserExCoupon)
    {
        List<SysUserExCoupon> list = sysUserExCouponService.selectSysUserExCouponList(sysUserExCoupon);
        ExcelUtil<SysUserExCoupon> util = new ExcelUtil<SysUserExCoupon>(SysUserExCoupon.class);
        util.exportExcel(response, list, "用户关联优惠券数据");
    }

    /**
     * 获取用户关联优惠券详细信息
     */
    @PreAuthorize("@ss.hasPermi('system:coupon:query')")
    @GetMapping(value = "/{id}")
    public AjaxResult getInfo(@PathVariable("id") Long id)
    {
        return success(sysUserExCouponService.selectSysUserExCouponById(id));
    }

    /**
     * 新增用户关联优惠券
     */
    @PreAuthorize("@ss.hasPermi('system:coupon:add')")
    @Log(title = "用户关联优惠券", businessType = BusinessType.INSERT)
    @PostMapping
    public AjaxResult add(@RequestBody SysUserExCoupon sysUserExCoupon)
    {
        return toAjax(sysUserExCouponService.insertSysUserExCoupon(sysUserExCoupon));
    }

    /**
     * 修改用户关联优惠券
     */
    @PreAuthorize("@ss.hasPermi('system:coupon:edit')")
    @Log(title = "用户关联优惠券", businessType = BusinessType.UPDATE)
    @PutMapping
    public AjaxResult edit(@RequestBody SysUserExCoupon sysUserExCoupon)
    {
        return toAjax(sysUserExCouponService.updateSysUserExCoupon(sysUserExCoupon));
    }

    /**
     * 删除用户关联优惠券
     */
    @PreAuthorize("@ss.hasPermi('system:coupon:remove')")
    @Log(title = "用户关联优惠券", businessType = BusinessType.DELETE)
	@DeleteMapping("/{ids}")
    public AjaxResult remove(@PathVariable Long[] ids)
    {
        return toAjax(sysUserExCouponService.deleteSysUserExCouponByIds(ids));
    }

    /**
     * 管理端发放优惠券
     * @param sysUserExCoupon
     * @return
     */
    @PreAuthorize("@ss.hasPermi('system:coupon:add')")
    @Log(title = "管理端发放优惠券", businessType = BusinessType.INSERT)
    @PostMapping("/issueCoupons")
    public AjaxResult issueCoupons(@RequestBody SysUserExCoupon sysUserExCoupon)
    {
        AjaxResult ajaxResult = null;
        int count = sysUserExCouponService.issueCoupons(sysUserExCoupon, sysUserExCoupon.getPhonenumber());
        if(count > 0){
            ajaxResult = AjaxResult.success();
        }else if(count == -1){
            ajaxResult = AjaxResult.error();
            ajaxResult.put("msg", "发券失败：券库存不足");
        }else if(count == 0){
            ajaxResult = AjaxResult.error();
            ajaxResult.put("msg", "发券失败");
        }else if(count == -2){
            ajaxResult = AjaxResult.error();
            ajaxResult.put("msg", "发券失败：不存在当前手机号的用户");
        }
        return ajaxResult;
    }
}
