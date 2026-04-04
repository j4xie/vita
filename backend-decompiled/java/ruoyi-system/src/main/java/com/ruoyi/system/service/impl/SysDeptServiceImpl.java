/*
 * Decompiled with CFR 0.152.
 * 
 * Could not load the following classes:
 *  com.ruoyi.common.annotation.DataScope
 *  com.ruoyi.common.core.domain.TreeSelect
 *  com.ruoyi.common.core.domain.entity.SysDept
 *  com.ruoyi.common.core.domain.entity.SysRole
 *  com.ruoyi.common.core.domain.entity.SysUser
 *  com.ruoyi.common.core.text.Convert
 *  com.ruoyi.common.exception.ServiceException
 *  com.ruoyi.common.utils.SecurityUtils
 *  com.ruoyi.common.utils.StringUtils
 *  com.ruoyi.common.utils.spring.SpringUtils
 *  org.springframework.beans.factory.annotation.Autowired
 *  org.springframework.stereotype.Service
 */
package com.ruoyi.system.service.impl;

import com.ruoyi.common.annotation.DataScope;
import com.ruoyi.common.core.domain.TreeSelect;
import com.ruoyi.common.core.domain.entity.SysDept;
import com.ruoyi.common.core.domain.entity.SysRole;
import com.ruoyi.common.core.domain.entity.SysUser;
import com.ruoyi.common.core.text.Convert;
import com.ruoyi.common.exception.ServiceException;
import com.ruoyi.common.utils.SecurityUtils;
import com.ruoyi.common.utils.StringUtils;
import com.ruoyi.common.utils.spring.SpringUtils;
import com.ruoyi.system.mapper.SysDeptMapper;
import com.ruoyi.system.mapper.SysRoleMapper;
import com.ruoyi.system.service.ISysDeptService;
import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

@Service
public class SysDeptServiceImpl
implements ISysDeptService {
    @Autowired
    private SysDeptMapper deptMapper;
    @Autowired
    private SysRoleMapper roleMapper;

    @Override
    @DataScope(deptAlias="d")
    public List<SysDept> selectDeptList(SysDept dept) {
        return this.deptMapper.selectDeptList(dept);
    }

    @Override
    public List<SysDept> selectDeptListForApp(SysDept dept) {
        return this.deptMapper.selectDeptListForApp(dept);
    }

    @Override
    public List<SysDept> selectTopDeptList(SysDept dept) {
        return this.deptMapper.selectTopDeptList(dept);
    }

    @Override
    public List<TreeSelect> selectDeptTreeList(SysDept dept) {
        List<SysDept> depts = ((SysDeptServiceImpl)SpringUtils.getAopProxy((Object)this)).selectDeptList(dept);
        return this.buildDeptTreeSelect(depts);
    }

    @Override
    public List<SysDept> buildDeptTree(List<SysDept> depts) {
        List<SysDept> returnList = new ArrayList<SysDept>();
        List tempList = depts.stream().map(SysDept::getDeptId).collect(Collectors.toList());
        for (SysDept dept : depts) {
            if (tempList.contains(dept.getParentId())) continue;
            this.recursionFn(depts, dept);
            returnList.add(dept);
        }
        if (returnList.isEmpty()) {
            returnList = depts;
        }
        return returnList;
    }

    @Override
    public List<TreeSelect> buildDeptTreeSelect(List<SysDept> depts) {
        List<SysDept> deptTrees = this.buildDeptTree(depts);
        return deptTrees.stream().map(TreeSelect::new).collect(Collectors.toList());
    }

    @Override
    public List<Long> selectDeptListByRoleId(Long roleId) {
        SysRole role = this.roleMapper.selectRoleById(roleId);
        return this.deptMapper.selectDeptListByRoleId(roleId, role.isDeptCheckStrictly());
    }

    @Override
    public SysDept selectDeptById(Long deptId) {
        return this.deptMapper.selectDeptById(deptId);
    }

    @Override
    public int selectNormalChildrenDeptById(Long deptId) {
        return this.deptMapper.selectNormalChildrenDeptById(deptId);
    }

    @Override
    public boolean hasChildByDeptId(Long deptId) {
        int result = this.deptMapper.hasChildByDeptId(deptId);
        return result > 0;
    }

    @Override
    public boolean checkDeptExistUser(Long deptId) {
        int result = this.deptMapper.checkDeptExistUser(deptId);
        return result > 0;
    }

    @Override
    public boolean checkDeptNameUnique(SysDept dept) {
        Long deptId = StringUtils.isNull((Object)dept.getDeptId()) ? -1L : dept.getDeptId();
        SysDept info = this.deptMapper.checkDeptNameUnique(dept.getDeptName(), dept.getParentId());
        return !StringUtils.isNotNull((Object)info) || info.getDeptId().longValue() == deptId.longValue();
    }

    @Override
    public void checkDeptDataScope(Long deptId) {
        if (!SysUser.isAdmin((Long)SecurityUtils.getUserId()) && StringUtils.isNotNull((Object)deptId)) {
            SysDept dept = new SysDept();
            dept.setDeptId(deptId);
            List<SysDept> depts = ((SysDeptServiceImpl)SpringUtils.getAopProxy((Object)this)).selectDeptList(dept);
            if (StringUtils.isEmpty(depts)) {
                throw new ServiceException("\u6ca1\u6709\u6743\u9650\u8bbf\u95ee\u90e8\u95e8\u6570\u636e\uff01");
            }
        }
    }

    @Override
    public int insertDept(SysDept dept) {
        SysDept info = this.deptMapper.selectDeptById(dept.getParentId());
        if (!"0".equals(info.getStatus())) {
            throw new ServiceException("\u90e8\u95e8\u505c\u7528\uff0c\u4e0d\u5141\u8bb8\u65b0\u589e");
        }
        dept.setAncestors(info.getAncestors() + "," + dept.getParentId());
        return this.deptMapper.insertDept(dept);
    }

    @Override
    public int updateDept(SysDept dept) {
        SysDept newParentDept = this.deptMapper.selectDeptById(dept.getParentId());
        SysDept oldDept = this.deptMapper.selectDeptById(dept.getDeptId());
        if (StringUtils.isNotNull((Object)newParentDept) && StringUtils.isNotNull((Object)oldDept)) {
            String newAncestors = newParentDept.getAncestors() + "," + newParentDept.getDeptId();
            String oldAncestors = oldDept.getAncestors();
            dept.setAncestors(newAncestors);
            this.updateDeptChildren(dept.getDeptId(), newAncestors, oldAncestors);
        }
        int result = this.deptMapper.updateDept(dept);
        if ("0".equals(dept.getStatus()) && StringUtils.isNotEmpty((String)dept.getAncestors()) && !StringUtils.equals((CharSequence)"0", (CharSequence)dept.getAncestors())) {
            this.updateParentDeptStatusNormal(dept);
        }
        return result;
    }

    private void updateParentDeptStatusNormal(SysDept dept) {
        String ancestors = dept.getAncestors();
        Long[] deptIds = Convert.toLongArray((String)ancestors);
        this.deptMapper.updateDeptStatusNormal(deptIds);
    }

    public void updateDeptChildren(Long deptId, String newAncestors, String oldAncestors) {
        List<SysDept> children = this.deptMapper.selectChildrenDeptById(deptId);
        for (SysDept child : children) {
            child.setAncestors(child.getAncestors().replaceFirst(oldAncestors, newAncestors));
        }
        if (children.size() > 0) {
            this.deptMapper.updateDeptChildren(children);
        }
    }

    @Override
    public int deleteDeptById(Long deptId) {
        return this.deptMapper.deleteDeptById(deptId);
    }

    private void recursionFn(List<SysDept> list, SysDept t) {
        List<SysDept> childList = this.getChildList(list, t);
        t.setChildren(childList);
        for (SysDept tChild : childList) {
            if (!this.hasChild(list, tChild)) continue;
            this.recursionFn(list, tChild);
        }
    }

    private List<SysDept> getChildList(List<SysDept> list, SysDept t) {
        ArrayList<SysDept> tlist = new ArrayList<SysDept>();
        for (SysDept n : list) {
            if (!StringUtils.isNotNull((Object)n.getParentId()) || n.getParentId().longValue() != t.getDeptId().longValue()) continue;
            tlist.add(n);
        }
        return tlist;
    }

    private boolean hasChild(List<SysDept> list, SysDept t) {
        return this.getChildList(list, t).size() > 0;
    }
}

