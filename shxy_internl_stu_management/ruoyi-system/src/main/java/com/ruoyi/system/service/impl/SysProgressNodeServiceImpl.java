package com.ruoyi.system.service.impl;

import java.util.List;
import com.ruoyi.common.utils.DateUtils;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import com.ruoyi.system.mapper.SysProgressNodeMapper;
import com.ruoyi.system.domain.SysProgressNode;
import com.ruoyi.system.service.ISysProgressNodeService;

/**
 * 流程节点Service业务层处理
 * 
 * @author ruoyi
 * @date 2026-03-25
 */
@Service
public class SysProgressNodeServiceImpl implements ISysProgressNodeService 
{
    @Autowired
    private SysProgressNodeMapper sysProgressNodeMapper;

    /**
     * 查询流程节点
     * 
     * @param id 流程节点主键
     * @return 流程节点
     */
    @Override
    public SysProgressNode selectSysProgressNodeById(Long id)
    {
        return sysProgressNodeMapper.selectSysProgressNodeById(id);
    }

    /**
     * 查询流程节点列表
     * 
     * @param sysProgressNode 流程节点
     * @return 流程节点
     */
    @Override
    public List<SysProgressNode> selectSysProgressNodeList(SysProgressNode sysProgressNode)
    {
        return sysProgressNodeMapper.selectSysProgressNodeList(sysProgressNode);
    }

    /**
     * 新增流程节点
     * 
     * @param sysProgressNode 流程节点
     * @return 结果
     */
    @Override
    public int insertSysProgressNode(SysProgressNode sysProgressNode)
    {
        sysProgressNode.setCreateTime(DateUtils.getNowDate());
        return sysProgressNodeMapper.insertSysProgressNode(sysProgressNode);
    }

    /**
     * 修改流程节点
     * 
     * @param sysProgressNode 流程节点
     * @return 结果
     */
    @Override
    public int updateSysProgressNode(SysProgressNode sysProgressNode)
    {
        return sysProgressNodeMapper.updateSysProgressNode(sysProgressNode);
    }

    /**
     * 批量删除流程节点
     * 
     * @param ids 需要删除的流程节点主键
     * @return 结果
     */
    @Override
    public int deleteSysProgressNodeByIds(Long[] ids)
    {
        return sysProgressNodeMapper.deleteSysProgressNodeByIds(ids);
    }

    /**
     * 删除流程节点信息
     * 
     * @param id 流程节点主键
     * @return 结果
     */
    @Override
    public int deleteSysProgressNodeById(Long id)
    {
        return sysProgressNodeMapper.deleteSysProgressNodeById(id);
    }
}
