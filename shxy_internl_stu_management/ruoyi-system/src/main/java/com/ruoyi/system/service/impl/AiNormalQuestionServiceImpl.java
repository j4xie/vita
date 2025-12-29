package com.ruoyi.system.service.impl;

import java.util.List;
import com.ruoyi.common.utils.DateUtils;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import com.ruoyi.system.mapper.AiNormalQuestionMapper;
import com.ruoyi.system.domain.AiNormalQuestion;
import com.ruoyi.system.service.IAiNormalQuestionService;

/**
 * AI常用问题Service业务层处理
 * 
 * @author ruoyi
 * @date 2025-10-17
 */
@Service
public class AiNormalQuestionServiceImpl implements IAiNormalQuestionService 
{
    @Autowired
    private AiNormalQuestionMapper aiNormalQuestionMapper;

    /**
     * 查询AI常用问题
     * 
     * @param id AI常用问题主键
     * @return AI常用问题
     */
    @Override
    public AiNormalQuestion selectAiNormalQuestionById(Long id)
    {
        return aiNormalQuestionMapper.selectAiNormalQuestionById(id);
    }

    /**
     * 查询AI常用问题列表
     * 
     * @param aiNormalQuestion AI常用问题
     * @return AI常用问题
     */
    @Override
    public List<AiNormalQuestion> selectAiNormalQuestionList(AiNormalQuestion aiNormalQuestion)
    {
        return aiNormalQuestionMapper.selectAiNormalQuestionList(aiNormalQuestion);
    }

    /**
     * 新增AI常用问题
     * 
     * @param aiNormalQuestion AI常用问题
     * @return 结果
     */
    @Override
    public int insertAiNormalQuestion(AiNormalQuestion aiNormalQuestion)
    {
        aiNormalQuestion.setCreateTime(DateUtils.getNowDate());
        return aiNormalQuestionMapper.insertAiNormalQuestion(aiNormalQuestion);
    }

    /**
     * 修改AI常用问题
     * 
     * @param aiNormalQuestion AI常用问题
     * @return 结果
     */
    @Override
    public int updateAiNormalQuestion(AiNormalQuestion aiNormalQuestion)
    {
        return aiNormalQuestionMapper.updateAiNormalQuestion(aiNormalQuestion);
    }

    /**
     * 批量删除AI常用问题
     * 
     * @param ids 需要删除的AI常用问题主键
     * @return 结果
     */
    @Override
    public int deleteAiNormalQuestionByIds(Long[] ids)
    {
        return aiNormalQuestionMapper.deleteAiNormalQuestionByIds(ids);
    }

    /**
     * 删除AI常用问题信息
     * 
     * @param id AI常用问题主键
     * @return 结果
     */
    @Override
    public int deleteAiNormalQuestionById(Long id)
    {
        return aiNormalQuestionMapper.deleteAiNormalQuestionById(id);
    }
}
