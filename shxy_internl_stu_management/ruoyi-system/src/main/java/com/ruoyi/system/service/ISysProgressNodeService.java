package com.ruoyi.system.service;

import java.util.List;
import com.ruoyi.system.domain.SysProgressNode;

/**
 * 流程节点Service接口
 * 
 * @author ruoyi
 * @date 2026-03-25
 */
public interface ISysProgressNodeService 
{
    /**
     * 查询流程节点
     * 
     * @param id 流程节点主键
     * @return 流程节点
     */
    public SysProgressNode selectSysProgressNodeById(Long id);

    /**
     * 查询流程节点列表
     * 
     * @param sysProgressNode 流程节点
     * @return 流程节点集合
     */
    public List<SysProgressNode> selectSysProgressNodeList(SysProgressNode sysProgressNode);

    /**
     * 新增流程节点
     * 
     * @param sysProgressNode 流程节点
     * @return 结果
     */
    public int insertSysProgressNode(SysProgressNode sysProgressNode);

    /**
     * 修改流程节点
     * 
     * @param sysProgressNode 流程节点
     * @return 结果
     */
    public int updateSysProgressNode(SysProgressNode sysProgressNode);

    /**
     * 审批操作
     *
     * @param sysProgressNode 流程节点
     * @return 结果
     */
    public int approvalOperationProgressNode(SysProgressNode sysProgressNode);

    /**
     * 批量删除流程节点
     * 
     * @param ids 需要删除的流程节点主键集合
     * @return 结果
     */
    public int deleteSysProgressNodeByIds(Long[] ids);

    /**
     * 删除流程节点信息
     * 
     * @param id 流程节点主键
     * @return 结果
     */
    public int deleteSysProgressNodeById(Long id);
}
