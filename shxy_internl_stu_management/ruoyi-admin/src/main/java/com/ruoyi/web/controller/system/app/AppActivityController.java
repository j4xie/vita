package com.ruoyi.web.controller.system.app;

import com.ruoyi.common.annotation.Log;
import com.ruoyi.common.core.controller.BaseController;
import com.ruoyi.common.core.domain.AjaxResult;
import com.ruoyi.common.core.page.TableDataInfo;
import com.ruoyi.common.enums.BusinessType;
import com.ruoyi.common.utils.poi.ExcelUtil;
import com.ruoyi.system.domain.Activity;
import com.ruoyi.system.domain.ActivityExUser;
import com.ruoyi.system.domain.UserExtendsData;
import com.ruoyi.system.domain.vo.ActivityExUserVo;
import com.ruoyi.system.service.IActivityExUserService;
import com.ruoyi.system.service.IActivityService;
import com.ruoyi.system.service.IUserExtendsDataService;
import org.apache.http.util.TextUtils;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.transaction.interceptor.TransactionAspectSupport;
import org.springframework.web.bind.annotation.*;

import javax.servlet.http.HttpServletResponse;
import java.util.List;

/**
 * 活动Controller
 * 
 * @author ruoyi
 * @date 2025-08-13
 */
@RestController
@RequestMapping("/app/activity")
public class AppActivityController extends BaseController
{
    @Autowired
    private IActivityService activityService;

    @Autowired
    private IActivityExUserService activityExUserService;

    @Autowired
    private IUserExtendsDataService  userExtendsDataService;

    /**
     * 查询活动列表
     */
    @GetMapping("/list")
    public TableDataInfo list(Activity activity)
    {
        startPage();
        List<Activity> list = activityService.selectActivityListForApp(activity);
        return getDataTable(list);
    }

    /**
     * 查看和用户相关的活动
     * @param activity
     * @return
     */
    @GetMapping("/userActivitylist")
    public TableDataInfo userActivitylist(Activity activity)
    {
        startPage();
        List<Activity> list = activityService.selectActivityListByUser(activity);
        return getDataTable(list);
    }


    /**
     * 获取活动详细信息
     */
    @GetMapping(value = "/info")
    public AjaxResult getInfo(Long id)
    {
        return success(activityService.selectActivityById(id));
    }

    /**
     * 查看是否报名
     * @param activityExUser
     * @return
     */
    @GetMapping("/getSignInfo")
    public AjaxResult getSignInfo(ActivityExUser activityExUser)
    {
        if(null != activityExUser && null != activityExUser.getActivityId() && null != activityExUser.getUserId()){
            AjaxResult ajax = AjaxResult.success();
            startPage();
            List<ActivityExUserVo> list = activityExUserService.selectActivityExUserVoList(activityExUser);
            Long count = 0L;
            if(!list.isEmpty()){
                if(list.get(0).getStatus() == -1){
                    count = -2L;
                }else{
                    count = list.get(0).getSignStatus();
                }
            }
            ajax.put("data", count);//-1已报名未签到   0未报名   1已报名已签到   -2报名待付款
            return ajax;
        }else{
            AjaxResult ajax = AjaxResult.error();
            return ajax;
        }
    }

    /**
     * 签到
     * @param activityExUser
     * @return
     */
    @Transactional(rollbackFor = Exception.class)
    @GetMapping("/signIn")
    public AjaxResult signIn(ActivityExUser activityExUser)
    {
        try{
            if(null != activityExUser && null != activityExUser.getActivityId() && null != activityExUser.getUserId()){
                AjaxResult ajax = AjaxResult.success();
                ActivityExUser activityExUserDTO = new ActivityExUser();
                activityExUserDTO.setActivityId(activityExUser.getActivityId());
                activityExUserDTO.setUserId(activityExUser.getUserId());
                activityExUserDTO.setSignStatus(1L);
                int count = activityExUserService.updateActivityExUser(activityExUserDTO);
                if(count > 0){
                    Activity activity = activityService.selectActivityById(activityExUser.getActivityId());
                    if(null != activity && null != activity.getPoint()){
                        //签到获取积分
                        UserExtendsData userExtendsData = new UserExtendsData();
                        userExtendsData.setUserId(activityExUser.getUserId());
                        userExtendsData.setUserPoint(activity.getPoint());
                        int res = userExtendsDataService.addUserPoint(userExtendsData);
                        if(res > 0){
                            ajax.put("msg", "签到成功，获得积分：" + activity.getPoint());
                            return ajax;
                        }
                    }
                }else{
                    ajax = AjaxResult.error();
                    return ajax;
                }
                ajax.put("msg", "签到成功");
                ajax.put("data", count);
                return ajax;
            }else{
                AjaxResult ajax = AjaxResult.error();
                return ajax;
            }
        } catch (Exception e) {
            //强制事务回滚
            TransactionAspectSupport.currentTransactionStatus().setRollbackOnly();
            AjaxResult ajax = AjaxResult.error();
            return ajax;
        }
    }

    /**
     * 活动报名接口
     * @param activityExUser
     * @param isCancel   有值 为1的时候是取消报名
     * @return
     */
    @Transactional(rollbackFor = Exception.class)
    @GetMapping("/enroll")
    public AjaxResult enroll(ActivityExUser activityExUser, String isCancel)
    {
        try{
            if(null != activityExUser && null != activityExUser.getActivityId() && null != activityExUser.getUserId()){
                AjaxResult ajax = AjaxResult.success();
                ActivityExUser activityExUserDTO = new ActivityExUser();
                activityExUserDTO.setActivityId(activityExUser.getActivityId());
                activityExUserDTO.setUserId(activityExUser.getUserId());

                if(!TextUtils.isEmpty(isCancel) && "1".equals(isCancel)){
                    //取消报名
                    int count = activityExUserService.deleteActivityRegist(activityExUser);
                    ajax.put("data", 1);
                    ajax.put("msg", "取消报名成功");
                    return ajax;
                }

                //校验是否存在报名信息
                List<ActivityExUser> list = activityExUserService.selectActivityExUserList(activityExUserDTO);
                if(!list.isEmpty() && list.size() > 0){
                    ajax.put("data", -1);
                    ajax.put("msg", "报名信息已存在");
                    return ajax;
                }
                //校验报名人数是否已满
                Activity activity = activityService.selectActivityById(activityExUser.getActivityId());
                activityExUserDTO.setUserId(null);
                List<ActivityExUser> listVO = activityExUserService.selectActivityExUserList(activityExUserDTO);
                if(!listVO.isEmpty() && listVO.size() > 0){
                    if(listVO.size() >= activity.getEnrollment() && 0 != activity.getEnrollment()){
                        ajax.put("data", -1);
                        ajax.put("msg", "报名失败：活动人数已满");
                        return ajax;
                    }
                }

                activityExUserDTO.setUserId(activityExUser.getUserId());
                activityExUserDTO.setSignStatus(-1L);
                if(null != activityExUser.getModelFormInfo()){
                    activityExUserDTO.setModelFormInfo(activityExUser.getModelFormInfo());
                }
                int count = activityExUserService.insertActivityExUser(activityExUserDTO);
                ajax.put("data", count);
                return ajax;
            }else{
                AjaxResult ajax = AjaxResult.error();
                return ajax;
            }
        }catch (Exception e){
            //强制事务回滚
            TransactionAspectSupport.currentTransactionStatus().setRollbackOnly();
            AjaxResult ajax = AjaxResult.error();
            ajax.put("data", -2);
            ajax.put("msg", "报名失败");
            return ajax;
        }

    }

    /**
     * 查询活动报名列表
     */
    @GetMapping("/actSignList")
    public TableDataInfo actSignList(ActivityExUser activityExUser)
    {
        startPage();
        List<ActivityExUserVo> list = activityExUserService.selectActivityExUserVoList(activityExUser);
        return getDataTable(list);
    }
}
