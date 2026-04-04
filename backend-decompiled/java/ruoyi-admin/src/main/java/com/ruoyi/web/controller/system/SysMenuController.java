/*
 * Decompiled with CFR 0.152.
 * 
 * Could not load the following classes:
 *  com.ruoyi.common.annotation.Log
 *  com.ruoyi.common.core.controller.BaseController
 *  com.ruoyi.common.core.domain.AjaxResult
 *  com.ruoyi.common.core.domain.entity.SysMenu
 *  com.ruoyi.common.enums.BusinessType
 *  com.ruoyi.common.utils.StringUtils
 *  com.ruoyi.system.service.ISysMenuService
 *  org.springframework.beans.factory.annotation.Autowired
 *  org.springframework.security.access.prepost.PreAuthorize
 *  org.springframework.validation.annotation.Validated
 *  org.springframework.web.bind.annotation.DeleteMapping
 *  org.springframework.web.bind.annotation.GetMapping
 *  org.springframework.web.bind.annotation.PathVariable
 *  org.springframework.web.bind.annotation.PostMapping
 *  org.springframework.web.bind.annotation.PutMapping
 *  org.springframework.web.bind.annotation.RequestBody
 *  org.springframework.web.bind.annotation.RequestMapping
 *  org.springframework.web.bind.annotation.RestController
 */
package com.ruoyi.web.controller.system;

import com.ruoyi.common.annotation.Log;
import com.ruoyi.common.core.controller.BaseController;
import com.ruoyi.common.core.domain.AjaxResult;
import com.ruoyi.common.core.domain.entity.SysMenu;
import com.ruoyi.common.enums.BusinessType;
import com.ruoyi.common.utils.StringUtils;
import com.ruoyi.system.service.ISysMenuService;
import java.util.List;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping(value={"/system/menu"})
public class SysMenuController
extends BaseController {
    @Autowired
    private ISysMenuService menuService;

    @PreAuthorize(value="@ss.hasPermi('system:menu:list')")
    @GetMapping(value={"/list"})
    public AjaxResult list(SysMenu menu) {
        List menus = this.menuService.selectMenuList(menu, this.getUserId());
        return this.success(menus);
    }

    @PreAuthorize(value="@ss.hasPermi('system:menu:query')")
    @GetMapping(value={"/{menuId}"})
    public AjaxResult getInfo(@PathVariable Long menuId) {
        return this.success(this.menuService.selectMenuById(menuId));
    }

    @GetMapping(value={"/treeselect"})
    public AjaxResult treeselect(SysMenu menu) {
        List menus = this.menuService.selectMenuList(menu, this.getUserId());
        return this.success(this.menuService.buildMenuTreeSelect(menus));
    }

    @GetMapping(value={"/roleMenuTreeselect/{roleId}"})
    public AjaxResult roleMenuTreeselect(@PathVariable(value="roleId") Long roleId) {
        List menus = this.menuService.selectMenuList(this.getUserId());
        AjaxResult ajax = AjaxResult.success();
        ajax.put("checkedKeys", (Object)this.menuService.selectMenuListByRoleId(roleId));
        ajax.put("menus", (Object)this.menuService.buildMenuTreeSelect(menus));
        return ajax;
    }

    @PreAuthorize(value="@ss.hasPermi('system:menu:add')")
    @Log(title="\u83dc\u5355\u7ba1\u7406", businessType=BusinessType.INSERT)
    @PostMapping
    public AjaxResult add(@Validated @RequestBody SysMenu menu) {
        if (!this.menuService.checkMenuNameUnique(menu)) {
            return this.error("\u65b0\u589e\u83dc\u5355'" + menu.getMenuName() + "'\u5931\u8d25\uff0c\u83dc\u5355\u540d\u79f0\u5df2\u5b58\u5728");
        }
        if ("0".equals(menu.getIsFrame()) && !StringUtils.ishttp((String)menu.getPath())) {
            return this.error("\u65b0\u589e\u83dc\u5355'" + menu.getMenuName() + "'\u5931\u8d25\uff0c\u5730\u5740\u5fc5\u987b\u4ee5http(s)://\u5f00\u5934");
        }
        menu.setCreateBy(this.getUsername());
        return this.toAjax(this.menuService.insertMenu(menu));
    }

    @PreAuthorize(value="@ss.hasPermi('system:menu:edit')")
    @Log(title="\u83dc\u5355\u7ba1\u7406", businessType=BusinessType.UPDATE)
    @PutMapping
    public AjaxResult edit(@Validated @RequestBody SysMenu menu) {
        if (!this.menuService.checkMenuNameUnique(menu)) {
            return this.error("\u4fee\u6539\u83dc\u5355'" + menu.getMenuName() + "'\u5931\u8d25\uff0c\u83dc\u5355\u540d\u79f0\u5df2\u5b58\u5728");
        }
        if ("0".equals(menu.getIsFrame()) && !StringUtils.ishttp((String)menu.getPath())) {
            return this.error("\u4fee\u6539\u83dc\u5355'" + menu.getMenuName() + "'\u5931\u8d25\uff0c\u5730\u5740\u5fc5\u987b\u4ee5http(s)://\u5f00\u5934");
        }
        if (menu.getMenuId().equals(menu.getParentId())) {
            return this.error("\u4fee\u6539\u83dc\u5355'" + menu.getMenuName() + "'\u5931\u8d25\uff0c\u4e0a\u7ea7\u83dc\u5355\u4e0d\u80fd\u9009\u62e9\u81ea\u5df1");
        }
        menu.setUpdateBy(this.getUsername());
        return this.toAjax(this.menuService.updateMenu(menu));
    }

    @PreAuthorize(value="@ss.hasPermi('system:menu:remove')")
    @Log(title="\u83dc\u5355\u7ba1\u7406", businessType=BusinessType.DELETE)
    @DeleteMapping(value={"/{menuId}"})
    public AjaxResult remove(@PathVariable(value="menuId") Long menuId) {
        if (this.menuService.hasChildByMenuId(menuId)) {
            return this.warn("\u5b58\u5728\u5b50\u83dc\u5355,\u4e0d\u5141\u8bb8\u5220\u9664");
        }
        if (this.menuService.checkMenuExistRole(menuId)) {
            return this.warn("\u83dc\u5355\u5df2\u5206\u914d,\u4e0d\u5141\u8bb8\u5220\u9664");
        }
        return this.toAjax(this.menuService.deleteMenuById(menuId));
    }
}
