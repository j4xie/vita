/*
 * Decompiled with CFR 0.152.
 * 
 * Could not load the following classes:
 *  com.ruoyi.common.core.domain.entity.SysMenu
 *  org.apache.ibatis.annotations.Param
 */
package com.ruoyi.system.mapper;

import com.ruoyi.common.core.domain.entity.SysMenu;
import java.util.List;
import org.apache.ibatis.annotations.Param;

public interface SysMenuMapper {
    public List<SysMenu> selectMenuList(SysMenu var1);

    public List<String> selectMenuPerms();

    public List<SysMenu> selectMenuListByUserId(SysMenu var1);

    public List<String> selectMenuPermsByRoleId(Long var1);

    public List<String> selectMenuPermsByUserId(Long var1);

    public List<SysMenu> selectMenuTreeAll();

    public List<SysMenu> selectMenuTreeByUserId(Long var1);

    public List<Long> selectMenuListByRoleId(@Param(value="roleId") Long var1, @Param(value="menuCheckStrictly") boolean var2);

    public SysMenu selectMenuById(Long var1);

    public int hasChildByMenuId(Long var1);

    public int insertMenu(SysMenu var1);

    public int updateMenu(SysMenu var1);

    public int deleteMenuById(Long var1);

    public SysMenu checkMenuNameUnique(@Param(value="menuName") String var1, @Param(value="parentId") Long var2);
}

