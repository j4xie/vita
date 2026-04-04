/*
 * Decompiled with CFR 0.152.
 * 
 * Could not load the following classes:
 *  com.ruoyi.common.core.domain.entity.SysDept
 *  org.apache.ibatis.annotations.Param
 */
package com.ruoyi.system.mapper;

import com.ruoyi.common.core.domain.entity.SysDept;
import java.util.List;
import org.apache.ibatis.annotations.Param;

public interface SysDeptMapper {
    public List<SysDept> selectDeptList(SysDept var1);

    public List<SysDept> selectDeptListForApp(SysDept var1);

    public List<SysDept> selectTopDeptList(SysDept var1);

    public List<Long> selectDeptListByRoleId(@Param(value="roleId") Long var1, @Param(value="deptCheckStrictly") boolean var2);

    public SysDept selectDeptById(Long var1);

    public List<SysDept> selectChildrenDeptById(Long var1);

    public int selectNormalChildrenDeptById(Long var1);

    public int hasChildByDeptId(Long var1);

    public int checkDeptExistUser(Long var1);

    public SysDept checkDeptNameUnique(@Param(value="deptName") String var1, @Param(value="parentId") Long var2);

    public int insertDept(SysDept var1);

    public int updateDept(SysDept var1);

    public void updateDeptStatusNormal(Long[] var1);

    public int updateDeptChildren(@Param(value="depts") List<SysDept> var1);

    public int deleteDeptById(Long var1);
}

