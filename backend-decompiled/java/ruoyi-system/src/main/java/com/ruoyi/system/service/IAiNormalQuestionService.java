/*
 * Decompiled with CFR 0.152.
 */
package com.ruoyi.system.service;

import com.ruoyi.system.domain.AiNormalQuestion;
import java.util.List;

public interface IAiNormalQuestionService {
    public AiNormalQuestion selectAiNormalQuestionById(Long var1);

    public List<AiNormalQuestion> selectAiNormalQuestionList(AiNormalQuestion var1);

    public int insertAiNormalQuestion(AiNormalQuestion var1);

    public int updateAiNormalQuestion(AiNormalQuestion var1);

    public int deleteAiNormalQuestionByIds(Long[] var1);

    public int deleteAiNormalQuestionById(Long var1);
}

