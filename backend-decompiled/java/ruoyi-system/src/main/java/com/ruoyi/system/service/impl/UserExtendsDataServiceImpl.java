/*
 * Decompiled with CFR 0.152.
 * 
 * Could not load the following classes:
 *  org.springframework.beans.factory.annotation.Autowired
 *  org.springframework.stereotype.Service
 */
package com.ruoyi.system.service.impl;

import com.ruoyi.system.domain.UserExtendsData;
import com.ruoyi.system.mapper.UserExtendsDataMapper;
import com.ruoyi.system.service.IUserExtendsDataService;
import java.util.List;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

@Service
public class UserExtendsDataServiceImpl
implements IUserExtendsDataService {
    @Autowired
    private UserExtendsDataMapper userExtendsDataMapper;

    @Override
    public UserExtendsData selectUserExtendsDataByUserId(Long userId) {
        return this.userExtendsDataMapper.selectUserExtendsDataByUserId(userId);
    }

    @Override
    public List<UserExtendsData> selectUserExtendsDataList(UserExtendsData userExtendsData) {
        return this.userExtendsDataMapper.selectUserExtendsDataList(userExtendsData);
    }

    @Override
    public int insertUserExtendsData(UserExtendsData userExtendsData) {
        int count = this.userExtendsDataMapper.insertUserExtendsData(userExtendsData);
        return count;
    }

    @Override
    public int updateUserExtendsData(UserExtendsData userExtendsData) {
        return this.userExtendsDataMapper.updateUserExtendsData(userExtendsData);
    }

    @Override
    public int refundUserPoint(UserExtendsData userExtendsData) {
        return this.userExtendsDataMapper.refundUserPoint(userExtendsData);
    }

    @Override
    public int addUserPoint(UserExtendsData userExtendsData) {
        UserExtendsData userExtendsDataDTO = this.userExtendsDataMapper.selectUserExtendsDataByUserId(userExtendsData.getUserId());
        if (null != userExtendsDataDTO) {
            return this.userExtendsDataMapper.addUserPoint(userExtendsData);
        }
        return this.userExtendsDataMapper.insertUserExtendsData(userExtendsData);
    }

    @Override
    public int deleteUserExtendsDataByUserIds(Long[] userIds) {
        return this.userExtendsDataMapper.deleteUserExtendsDataByUserIds(userIds);
    }

    @Override
    public int deleteUserExtendsDataByUserId(Long userId) {
        return this.userExtendsDataMapper.deleteUserExtendsDataByUserId(userId);
    }
}

