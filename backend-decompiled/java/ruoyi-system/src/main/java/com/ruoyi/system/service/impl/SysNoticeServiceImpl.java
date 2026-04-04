/*
 * Decompiled with CFR 0.152.
 * 
 * Could not load the following classes:
 *  org.springframework.beans.factory.annotation.Autowired
 *  org.springframework.stereotype.Service
 */
package com.ruoyi.system.service.impl;

import com.ruoyi.system.domain.SysNotice;
import com.ruoyi.system.mapper.SysNoticeMapper;
import com.ruoyi.system.service.ISysNoticeService;
import java.util.List;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

@Service
public class SysNoticeServiceImpl
implements ISysNoticeService {
    @Autowired
    private SysNoticeMapper noticeMapper;

    @Override
    public SysNotice selectNoticeById(Long noticeId) {
        return this.noticeMapper.selectNoticeById(noticeId);
    }

    @Override
    public List<SysNotice> selectNoticeList(SysNotice notice) {
        return this.noticeMapper.selectNoticeList(notice);
    }

    @Override
    public int insertNotice(SysNotice notice) {
        return this.noticeMapper.insertNotice(notice);
    }

    @Override
    public int updateNotice(SysNotice notice) {
        return this.noticeMapper.updateNotice(notice);
    }

    @Override
    public int deleteNoticeById(Long noticeId) {
        return this.noticeMapper.deleteNoticeById(noticeId);
    }

    @Override
    public int deleteNoticeByIds(Long[] noticeIds) {
        return this.noticeMapper.deleteNoticeByIds(noticeIds);
    }
}

