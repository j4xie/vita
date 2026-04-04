/*
 * Decompiled with CFR 0.152.
 * 
 * Could not load the following classes:
 *  com.ruoyi.common.core.domain.TreeSelect
 *  com.ruoyi.common.core.domain.entity.SysMenu
 */
package com.ruoyi.system.service;

import com.ruoyi.common.core.domain.TreeSelect;
import com.ruoyi.common.core.domain.entity.SysMenu;
import com.ruoyi.system.domain.vo.RouterVo;
import java.util.List;
import java.util.Set;

public interface ISysMenuService {
    public List<SysMenu> selectMenuList(Long var1);

    public List<SysMenu> selectMenuList(SysMenu var1, Long var2);

    public Set<String> selectMenuPermsByUserId(Long var1);

    public Set<String> selectMenuPermsByRoleId(Long var1);

    public List<SysMenu> selectMenuTreeByUserId(Long var1);

    public List<Long> selectMenuListByRoleId(Long var1);

    public List<RouterVo> buildMenus(List<SysMenu> var1);

    public List<SysMenu> buildMenuTree(List<SysMenu> var1);

    public List<TreeSelect> buildMenuTreeSelect(List<SysMenu> var1);

    public SysMenu selectMenuById(Long var1);

    public boolean hasChildByMenuId(Long var1);

    public boolean checkMenuExistRole(Long var1);

    public int insertMenu(SysMenu var1);

    public int updateMenu(SysMenu var1);

    public int deleteMenuById(Long var1);

    public boolean checkMenuNameUnique(SysMenu var1);
}

