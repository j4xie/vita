package com.ruoyi.system.service;

import java.util.List;
import com.ruoyi.system.domain.SysProgressType;

/**
 * 流程分类Service接口
 * 
 * @author ruoyi
 * @date 2026-03-24
 */
public interface ISysProgressTypeService 
{
    /**
     * 查询流程分类
     * 
     * @param id 流程分类主键
     * @return 流程分类
     */
    public SysProgressType selectSysProgressTypeById(Long id);

    /**
     * 查询流程分类列表
     * 
     * @param sysProgressType 流程分类
     * @return 流程分类集合
     */
    public List<SysProgressType> selectSysProgressTypeList(SysProgressType sysProgressType);

    /**
     * 新增流程分类
     * 
     * @param sysProgressType 流程分类
     * @return 结果
     */
    public int insertSysProgressType(SysProgressType sysProgressType);

    /**
     * 修改流程分类
     * 
     * @param sysProgressType 流程分类
     * @return 结果
     */
    public int updateSysProgressType(SysProgressType sysProgressType);

    /**
     * 批量删除流程分类
     * 
     * @param ids 需要删除的流程分类主键集合
     * @return 结果
     */
    public int deleteSysProgressTypeByIds(Long[] ids);

    /**
     * 删除流程分类信息
     * 
     * @param id 流程分类主键
     * @return 结果
     */
    public int deleteSysProgressTypeById(Long id);
}
