/*
 * Decompiled with CFR 0.152.
 * 
 * Could not load the following classes:
 *  com.ruoyi.common.utils.DateUtils
 *  org.springframework.beans.factory.annotation.Autowired
 *  org.springframework.stereotype.Service
 */
package com.ruoyi.system.service.impl;

import com.ruoyi.common.utils.DateUtils;
import com.ruoyi.system.domain.AiNormalQuestion;
import com.ruoyi.system.mapper.AiNormalQuestionMapper;
import com.ruoyi.system.service.IAiNormalQuestionService;
import java.util.List;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

@Service
public class AiNormalQuestionServiceImpl
implements IAiNormalQuestionService {
    @Autowired
    private AiNormalQuestionMapper aiNormalQuestionMapper;

    @Override
    public AiNormalQuestion selectAiNormalQuestionById(Long id) {
        return this.aiNormalQuestionMapper.selectAiNormalQuestionById(id);
    }

    @Override
    public List<AiNormalQuestion> selectAiNormalQuestionList(AiNormalQuestion aiNormalQuestion) {
        return this.aiNormalQuestionMapper.selectAiNormalQuestionList(aiNormalQuestion);
    }

    @Override
    public int insertAiNormalQuestion(AiNormalQuestion aiNormalQuestion) {
        aiNormalQuestion.setCreateTime(DateUtils.getNowDate());
        return this.aiNormalQuestionMapper.insertAiNormalQuestion(aiNormalQuestion);
    }

    @Override
    public int updateAiNormalQuestion(AiNormalQuestion aiNormalQuestion) {
        return this.aiNormalQuestionMapper.updateAiNormalQuestion(aiNormalQuestion);
    }

    @Override
    public int deleteAiNormalQuestionByIds(Long[] ids) {
        return this.aiNormalQuestionMapper.deleteAiNormalQuestionByIds(ids);
    }

    @Override
    public int deleteAiNormalQuestionById(Long id) {
        return this.aiNormalQuestionMapper.deleteAiNormalQuestionById(id);
    }
}

