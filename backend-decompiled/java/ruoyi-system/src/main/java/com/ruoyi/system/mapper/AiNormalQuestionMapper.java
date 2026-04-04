/*
 * Decompiled with CFR 0.152.
 */
package com.ruoyi.system.mapper;

import com.ruoyi.system.domain.AiNormalQuestion;
import java.util.List;

public interface AiNormalQuestionMapper {
    public AiNormalQuestion selectAiNormalQuestionById(Long var1);

    public List<AiNormalQuestion> selectAiNormalQuestionList(AiNormalQuestion var1);

    public int insertAiNormalQuestion(AiNormalQuestion var1);

    public int updateAiNormalQuestion(AiNormalQuestion var1);

    public int deleteAiNormalQuestionById(Long var1);

    public int deleteAiNormalQuestionByIds(Long[] var1);
}

