/*
 * Decompiled with CFR 0.152.
 * 
 * Could not load the following classes:
 *  com.ruoyi.common.core.controller.BaseController
 *  com.ruoyi.common.core.domain.AjaxResult
 *  com.ruoyi.common.core.page.TableDataInfo
 *  com.ruoyi.system.domain.Activity
 *  com.ruoyi.system.domain.ActivityExUser
 *  com.ruoyi.system.domain.UserExtendsData
 *  com.ruoyi.system.domain.vo.ActivityExUserVo
 *  com.ruoyi.system.service.IActivityExUserService
 *  com.ruoyi.system.service.IActivityService
 *  com.ruoyi.system.service.IUserExtendsDataService
 *  org.apache.http.util.TextUtils
 *  org.springframework.beans.factory.annotation.Autowired
 *  org.springframework.transaction.annotation.Transactional
 *  org.springframework.transaction.interceptor.TransactionAspectSupport
 *  org.springframework.web.bind.annotation.GetMapping
 *  org.springframework.web.bind.annotation.PostMapping
 *  org.springframework.web.bind.annotation.RequestMapping
 *  org.springframework.web.bind.annotation.RestController
 */
package com.ruoyi.web.controller.system.app;

import com.ruoyi.common.core.controller.BaseController;
import com.ruoyi.common.core.domain.AjaxResult;
import com.ruoyi.common.core.page.TableDataInfo;
import com.ruoyi.system.domain.Activity;
import com.ruoyi.system.domain.ActivityExUser;
import com.ruoyi.system.domain.UserExtendsData;
import com.ruoyi.system.domain.vo.ActivityExUserVo;
import com.ruoyi.system.service.IActivityExUserService;
import com.ruoyi.system.service.IActivityService;
import com.ruoyi.system.service.IUserExtendsDataService;
import java.util.List;
import org.apache.http.util.TextUtils;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.transaction.interceptor.TransactionAspectSupport;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping(value={"/app/activity"})
public class AppActivityController
extends BaseController {
    @Autowired
    private IActivityService activityService;
    @Autowired
    private IActivityExUserService activityExUserService;
    @Autowired
    private IUserExtendsDataService userExtendsDataService;

    @GetMapping(value={"/list"})
    public TableDataInfo list(Activity activity) {
        this.startPage();
        List list = this.activityService.selectActivityListForApp(activity);
        return this.getDataTable(list);
    }

    @GetMapping(value={"/userActivitylist"})
    public TableDataInfo userActivitylist(Activity activity) {
        this.startPage();
        List list = this.activityService.selectActivityListByUser(activity);
        return this.getDataTable(list);
    }

    @GetMapping(value={"/info"})
    public AjaxResult getInfo(Long id) {
        return this.success(this.activityService.selectActivityById(id));
    }

    @GetMapping(value={"/getSignInfo"})
    public AjaxResult getSignInfo(ActivityExUser activityExUser) {
        if (null != activityExUser && null != activityExUser.getActivityId() && null != activityExUser.getUserId()) {
            AjaxResult ajax = AjaxResult.success();
            this.startPage();
            List list = this.activityExUserService.selectActivityExUserVoList(activityExUser);
            Long count = 0L;
            if (!list.isEmpty()) {
                count = ((ActivityExUserVo)list.get(0)).getStatus() == -1L ? Long.valueOf(-2L) : ((ActivityExUserVo)list.get(0)).getSignStatus();
            }
            ajax.put("data", (Object)count);
            return ajax;
        }
        AjaxResult ajax = AjaxResult.error();
        return ajax;
    }

    @Transactional(rollbackFor={Exception.class})
    @GetMapping(value={"/signIn"})
    public AjaxResult signIn(ActivityExUser activityExUser) {
        try {
            if (null != activityExUser && null != activityExUser.getActivityId() && null != activityExUser.getUserId()) {
                AjaxResult ajax = AjaxResult.success();
                ActivityExUser activityExUserDTO = new ActivityExUser();
                activityExUserDTO.setActivityId(activityExUser.getActivityId());
                activityExUserDTO.setUserId(activityExUser.getUserId());
                activityExUserDTO.setSignStatus(Long.valueOf(1L));
                int count = this.activityExUserService.updateActivityExUser(activityExUserDTO);
                if (count > 0) {
                    Activity activity = this.activityService.selectActivityById(activityExUser.getActivityId());
                    if (null != activity && null != activity.getPoint()) {
                        UserExtendsData userExtendsData = new UserExtendsData();
                        userExtendsData.setUserId(activityExUser.getUserId());
                        userExtendsData.setUserPoint(activity.getPoint());
                        int res = this.userExtendsDataService.addUserPoint(userExtendsData);
                        if (res > 0) {
                            ajax.put("msg", (Object)("\u7b7e\u5230\u6210\u529f\uff0c\u83b7\u5f97\u79ef\u5206\uff1a" + activity.getPoint()));
                            return ajax;
                        }
                    }
                } else {
                    ajax = AjaxResult.error();
                    return ajax;
                }
                ajax.put("msg", (Object)"\u7b7e\u5230\u6210\u529f");
                ajax.put("data", (Object)count);
                return ajax;
            }
            AjaxResult ajax = AjaxResult.error();
            return ajax;
        }
        catch (Exception e) {
            TransactionAspectSupport.currentTransactionStatus().setRollbackOnly();
            AjaxResult ajax = AjaxResult.error();
            return ajax;
        }
    }

    @Transactional(rollbackFor={Exception.class})
    @PostMapping(value={"/enroll"})
    public AjaxResult enroll(ActivityExUser activityExUser, String isCancel) {
        try {
            if (null != activityExUser && null != activityExUser.getActivityId() && null != activityExUser.getUserId()) {
                AjaxResult ajax = AjaxResult.success();
                ActivityExUser activityExUserDTO = new ActivityExUser();
                activityExUserDTO.setActivityId(activityExUser.getActivityId());
                activityExUserDTO.setUserId(activityExUser.getUserId());
                if (!TextUtils.isEmpty((CharSequence)isCancel) && "1".equals(isCancel)) {
                    int count = this.activityExUserService.deleteActivityRegist(activityExUser);
                    ajax.put("data", (Object)1);
                    ajax.put("msg", (Object)"\u53d6\u6d88\u62a5\u540d\u6210\u529f");
                    return ajax;
                }
                List list = this.activityExUserService.selectActivityExUserList(activityExUserDTO);
                if (!list.isEmpty() && list.size() > 0) {
                    ajax.put("data", (Object)-1);
                    ajax.put("msg", (Object)"\u62a5\u540d\u4fe1\u606f\u5df2\u5b58\u5728");
                    return ajax;
                }
                Activity activity = this.activityService.selectActivityById(activityExUser.getActivityId());
                activityExUserDTO.setUserId(null);
                List listVO = this.activityExUserService.selectActivityExUserList(activityExUserDTO);
                if (!listVO.isEmpty() && listVO.size() > 0 && listVO.size() >= activity.getEnrollment() && 0 != activity.getEnrollment()) {
                    ajax.put("data", (Object)-1);
                    ajax.put("msg", (Object)"\u62a5\u540d\u5931\u8d25\uff1a\u6d3b\u52a8\u4eba\u6570\u5df2\u6ee1");
                    return ajax;
                }
                activityExUserDTO.setUserId(activityExUser.getUserId());
                activityExUserDTO.setSignStatus(Long.valueOf(-1L));
                if (null != activityExUser.getModelFormInfo()) {
                    activityExUserDTO.setModelFormInfo(activityExUser.getModelFormInfo());
                }
                if (null != activityExUser.getShareUserId()) {
                    activityExUserDTO.setShareUserId(activityExUser.getShareUserId());
                }
                int count = this.activityExUserService.insertActivityExUser(activityExUserDTO);
                ajax.put("data", (Object)count);
                return ajax;
            }
            AjaxResult ajax = AjaxResult.error();
            return ajax;
        }
        catch (Exception e) {
            TransactionAspectSupport.currentTransactionStatus().setRollbackOnly();
            AjaxResult ajax = AjaxResult.error();
            ajax.put("data", (Object)-2);
            ajax.put("msg", (Object)"\u62a5\u540d\u5931\u8d25");
            return ajax;
        }
    }

    @GetMapping(value={"/actSignList"})
    public TableDataInfo actSignList(ActivityExUser activityExUser) {
        this.startPage();
        List list = this.activityExUserService.selectActivityExUserVoList(activityExUser);
        return this.getDataTable(list);
    }
}
