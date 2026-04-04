/*
 * Decompiled with CFR 0.152.
 * 
 * Could not load the following classes:
 *  com.ruoyi.common.core.domain.TreeSelect
 *  com.ruoyi.common.core.domain.entity.SysMenu
 *  com.ruoyi.common.core.domain.entity.SysRole
 *  com.ruoyi.common.core.domain.entity.SysUser
 *  com.ruoyi.common.utils.SecurityUtils
 *  com.ruoyi.common.utils.StringUtils
 *  org.springframework.beans.factory.annotation.Autowired
 *  org.springframework.stereotype.Service
 */
package com.ruoyi.system.service.impl;

import com.ruoyi.common.core.domain.TreeSelect;
import com.ruoyi.common.core.domain.entity.SysMenu;
import com.ruoyi.common.core.domain.entity.SysRole;
import com.ruoyi.common.core.domain.entity.SysUser;
import com.ruoyi.common.utils.SecurityUtils;
import com.ruoyi.common.utils.StringUtils;
import com.ruoyi.system.domain.vo.MetaVo;
import com.ruoyi.system.domain.vo.RouterVo;
import com.ruoyi.system.mapper.SysMenuMapper;
import com.ruoyi.system.mapper.SysRoleMapper;
import com.ruoyi.system.mapper.SysRoleMenuMapper;
import com.ruoyi.system.service.ISysMenuService;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.Collection;
import java.util.HashSet;
import java.util.LinkedList;
import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

@Service
public class SysMenuServiceImpl
implements ISysMenuService {
    public static final String PREMISSION_STRING = "perms[\"{0}\"]";
    @Autowired
    private SysMenuMapper menuMapper;
    @Autowired
    private SysRoleMapper roleMapper;
    @Autowired
    private SysRoleMenuMapper roleMenuMapper;

    @Override
    public List<SysMenu> selectMenuList(Long userId) {
        return this.selectMenuList(new SysMenu(), userId);
    }

    @Override
    public List<SysMenu> selectMenuList(SysMenu menu, Long userId) {
        List<SysMenu> menuList = null;
        if (SysUser.isAdmin((Long)userId)) {
            menuList = this.menuMapper.selectMenuList(menu);
        } else {
            menu.getParams().put("userId", userId);
            menuList = this.menuMapper.selectMenuListByUserId(menu);
        }
        return menuList;
    }

    @Override
    public Set<String> selectMenuPermsByUserId(Long userId) {
        List<String> perms = this.menuMapper.selectMenuPermsByUserId(userId);
        HashSet<String> permsSet = new HashSet<String>();
        for (String perm : perms) {
            if (!StringUtils.isNotEmpty((String)perm)) continue;
            permsSet.addAll(Arrays.asList(perm.trim().split(",")));
        }
        return permsSet;
    }

    @Override
    public Set<String> selectMenuPermsByRoleId(Long roleId) {
        List<String> perms = this.menuMapper.selectMenuPermsByRoleId(roleId);
        HashSet<String> permsSet = new HashSet<String>();
        for (String perm : perms) {
            if (!StringUtils.isNotEmpty((String)perm)) continue;
            permsSet.addAll(Arrays.asList(perm.trim().split(",")));
        }
        return permsSet;
    }

    @Override
    public List<SysMenu> selectMenuTreeByUserId(Long userId) {
        List<SysMenu> menus = null;
        menus = SecurityUtils.isAdmin((Long)userId) ? this.menuMapper.selectMenuTreeAll() : this.menuMapper.selectMenuTreeByUserId(userId);
        return this.getChildPerms(menus, 0);
    }

    @Override
    public List<Long> selectMenuListByRoleId(Long roleId) {
        SysRole role = this.roleMapper.selectRoleById(roleId);
        return this.menuMapper.selectMenuListByRoleId(roleId, role.isMenuCheckStrictly());
    }

    @Override
    public List<RouterVo> buildMenus(List<SysMenu> menus) {
        LinkedList<RouterVo> routers = new LinkedList<RouterVo>();
        for (SysMenu menu : menus) {
            RouterVo children;
            ArrayList<RouterVo> childrenList;
            RouterVo router = new RouterVo();
            router.setHidden("1".equals(menu.getVisible()));
            router.setName(this.getRouteName(menu));
            router.setPath(this.getRouterPath(menu));
            router.setComponent(this.getComponent(menu));
            router.setQuery(menu.getQuery());
            router.setMeta(new MetaVo(menu.getMenuName(), menu.getIcon(), StringUtils.equals((CharSequence)"1", (CharSequence)menu.getIsCache()), menu.getPath()));
            List cMenus = menu.getChildren();
            if (StringUtils.isNotEmpty((Collection)cMenus) && "M".equals(menu.getMenuType())) {
                router.setAlwaysShow(true);
                router.setRedirect("noRedirect");
                router.setChildren(this.buildMenus(cMenus));
            } else if (this.isMenuFrame(menu)) {
                router.setMeta(null);
                childrenList = new ArrayList<RouterVo>();
                children = new RouterVo();
                children.setPath(menu.getPath());
                children.setComponent(menu.getComponent());
                children.setName(this.getRouteName(menu.getRouteName(), menu.getPath()));
                children.setMeta(new MetaVo(menu.getMenuName(), menu.getIcon(), StringUtils.equals((CharSequence)"1", (CharSequence)menu.getIsCache()), menu.getPath()));
                children.setQuery(menu.getQuery());
                childrenList.add(children);
                router.setChildren(childrenList);
            } else if (menu.getParentId().intValue() == 0 && this.isInnerLink(menu)) {
                router.setMeta(new MetaVo(menu.getMenuName(), menu.getIcon()));
                router.setPath("/");
                childrenList = new ArrayList();
                children = new RouterVo();
                String routerPath = this.innerLinkReplaceEach(menu.getPath());
                children.setPath(routerPath);
                children.setComponent("InnerLink");
                children.setName(this.getRouteName(menu.getRouteName(), routerPath));
                children.setMeta(new MetaVo(menu.getMenuName(), menu.getIcon(), menu.getPath()));
                childrenList.add(children);
                router.setChildren(childrenList);
            }
            routers.add(router);
        }
        return routers;
    }

    @Override
    public List<SysMenu> buildMenuTree(List<SysMenu> menus) {
        List<SysMenu> returnList = new ArrayList<SysMenu>();
        List tempList = menus.stream().map(SysMenu::getMenuId).collect(Collectors.toList());
        for (SysMenu menu : menus) {
            if (tempList.contains(menu.getParentId())) continue;
            this.recursionFn(menus, menu);
            returnList.add(menu);
        }
        if (returnList.isEmpty()) {
            returnList = menus;
        }
        return returnList;
    }

    @Override
    public List<TreeSelect> buildMenuTreeSelect(List<SysMenu> menus) {
        List<SysMenu> menuTrees = this.buildMenuTree(menus);
        return menuTrees.stream().map(TreeSelect::new).collect(Collectors.toList());
    }

    @Override
    public SysMenu selectMenuById(Long menuId) {
        return this.menuMapper.selectMenuById(menuId);
    }

    @Override
    public boolean hasChildByMenuId(Long menuId) {
        int result = this.menuMapper.hasChildByMenuId(menuId);
        return result > 0;
    }

    @Override
    public boolean checkMenuExistRole(Long menuId) {
        int result = this.roleMenuMapper.checkMenuExistRole(menuId);
        return result > 0;
    }

    @Override
    public int insertMenu(SysMenu menu) {
        return this.menuMapper.insertMenu(menu);
    }

    @Override
    public int updateMenu(SysMenu menu) {
        return this.menuMapper.updateMenu(menu);
    }

    @Override
    public int deleteMenuById(Long menuId) {
        return this.menuMapper.deleteMenuById(menuId);
    }

    @Override
    public boolean checkMenuNameUnique(SysMenu menu) {
        Long menuId = StringUtils.isNull((Object)menu.getMenuId()) ? -1L : menu.getMenuId();
        SysMenu info = this.menuMapper.checkMenuNameUnique(menu.getMenuName(), menu.getParentId());
        return !StringUtils.isNotNull((Object)info) || info.getMenuId().longValue() == menuId.longValue();
    }

    public String getRouteName(SysMenu menu) {
        if (this.isMenuFrame(menu)) {
            return "";
        }
        return this.getRouteName(menu.getRouteName(), menu.getPath());
    }

    public String getRouteName(String name, String path) {
        String routerName = StringUtils.isNotEmpty((String)name) ? name : path;
        return StringUtils.capitalize((String)routerName);
    }

    public String getRouterPath(SysMenu menu) {
        Object routerPath = menu.getPath();
        if (menu.getParentId().intValue() != 0 && this.isInnerLink(menu)) {
            routerPath = this.innerLinkReplaceEach((String)routerPath);
        }
        if (0 == menu.getParentId().intValue() && "M".equals(menu.getMenuType()) && "1".equals(menu.getIsFrame())) {
            routerPath = "/" + menu.getPath();
        } else if (this.isMenuFrame(menu)) {
            routerPath = "/";
        }
        return routerPath;
    }

    public String getComponent(SysMenu menu) {
        String component = "Layout";
        if (StringUtils.isNotEmpty((String)menu.getComponent()) && !this.isMenuFrame(menu)) {
            component = menu.getComponent();
        } else if (StringUtils.isEmpty((String)menu.getComponent()) && menu.getParentId().intValue() != 0 && this.isInnerLink(menu)) {
            component = "InnerLink";
        } else if (StringUtils.isEmpty((String)menu.getComponent()) && this.isParentView(menu)) {
            component = "ParentView";
        }
        return component;
    }

    public boolean isMenuFrame(SysMenu menu) {
        return menu.getParentId().intValue() == 0 && "C".equals(menu.getMenuType()) && menu.getIsFrame().equals("1");
    }

    public boolean isInnerLink(SysMenu menu) {
        return menu.getIsFrame().equals("1") && StringUtils.ishttp((String)menu.getPath());
    }

    public boolean isParentView(SysMenu menu) {
        return menu.getParentId().intValue() != 0 && "M".equals(menu.getMenuType());
    }

    public List<SysMenu> getChildPerms(List<SysMenu> list, int parentId) {
        ArrayList<SysMenu> returnList = new ArrayList<SysMenu>();
        for (SysMenu t : list) {
            if (t.getParentId() != (long)parentId) continue;
            this.recursionFn(list, t);
            returnList.add(t);
        }
        return returnList;
    }

    private void recursionFn(List<SysMenu> list, SysMenu t) {
        List<SysMenu> childList = this.getChildList(list, t);
        t.setChildren(childList);
        for (SysMenu tChild : childList) {
            if (!this.hasChild(list, tChild)) continue;
            this.recursionFn(list, tChild);
        }
    }

    private List<SysMenu> getChildList(List<SysMenu> list, SysMenu t) {
        ArrayList<SysMenu> tlist = new ArrayList<SysMenu>();
        for (SysMenu n : list) {
            if (n.getParentId().longValue() != t.getMenuId().longValue()) continue;
            tlist.add(n);
        }
        return tlist;
    }

    private boolean hasChild(List<SysMenu> list, SysMenu t) {
        return this.getChildList(list, t).size() > 0;
    }

    public String innerLinkReplaceEach(String path) {
        return StringUtils.replaceEach((String)path, (String[])new String[]{"http://", "https://", "www.", ".", ":"}, (String[])new String[]{"", "", "", "/", "/"});
    }
}

