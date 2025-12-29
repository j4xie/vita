package com.ruoyi.system.service;

import java.util.List;
import com.ruoyi.system.domain.AiNormalQuestion;

/**
 * AI常用问题Service接口
 * 
 * @author ruoyi
 * @date 2025-10-17
 */
public interface IAiNormalQuestionService 
{
    /**
     * 查询AI常用问题
     * 
     * @param id AI常用问题主键
     * @return AI常用问题
     */
    public AiNormalQuestion selectAiNormalQuestionById(Long id);

    /**
     * 查询AI常用问题列表
     * 
     * @param aiNormalQuestion AI常用问题
     * @return AI常用问题集合
     */
    public List<AiNormalQuestion> selectAiNormalQuestionList(AiNormalQuestion aiNormalQuestion);

    /**
     * 新增AI常用问题
     * 
     * @param aiNormalQuestion AI常用问题
     * @return 结果
     */
    public int insertAiNormalQuestion(AiNormalQuestion aiNormalQuestion);

    /**
     * 修改AI常用问题
     * 
     * @param aiNormalQuestion AI常用问题
     * @return 结果
     */
    public int updateAiNormalQuestion(AiNormalQuestion aiNormalQuestion);

    /**
     * 批量删除AI常用问题
     * 
     * @param ids 需要删除的AI常用问题主键集合
     * @return 结果
     */
    public int deleteAiNormalQuestionByIds(Long[] ids);

    /**
     * 删除AI常用问题信息
     * 
     * @param id AI常用问题主键
     * @return 结果
     */
    public int deleteAiNormalQuestionById(Long id);
}
