package com.ruoyi.web.controller.system.app;

import com.ruoyi.common.annotation.Log;
import com.ruoyi.common.core.controller.BaseController;
import com.ruoyi.common.core.domain.AjaxResult;
import com.ruoyi.common.core.page.TableDataInfo;
import com.ruoyi.common.enums.BusinessType;
import com.ruoyi.common.utils.poi.ExcelUtil;
import com.ruoyi.system.domain.VolunteerManHour;
import com.ruoyi.system.domain.VolunteerRecord;
import com.ruoyi.system.service.IVolunteerManHourService;
import com.ruoyi.system.service.IVolunteerRecordService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.transaction.interceptor.TransactionAspectSupport;
import org.springframework.web.bind.annotation.*;

import javax.servlet.http.HttpServletResponse;
import java.time.Duration;
import java.util.List;

/**
 * 志愿者打卡记录及总工时Controller
 * 
 * @author ruoyi
 * @date 2025-08-16
 */
@RestController
@RequestMapping("/app/hour")
public class AppVolunteerController extends BaseController
{
    @Autowired
    private IVolunteerManHourService volunteerManHourService;

    @Autowired
    private IVolunteerRecordService volunteerRecordService;

    /**
     * 查询志愿者总工时列表
     */
    @PreAuthorize("@ss.hasPermi('system:role:client')")
    @GetMapping("/hourList")
    public TableDataInfo list(VolunteerManHour volunteerManHour)
    {
        startPage();
        List<VolunteerManHour> list = volunteerManHourService.selectVolunteerManHourListForApp(volunteerManHour);
        return getDataTable(list);
    }

    /**
     * 查询志愿者打卡记录列表
     */
    @PreAuthorize("@ss.hasPermi('system:role:client')")
    @GetMapping("/recordList")
    public TableDataInfo list(VolunteerRecord volunteerRecord)
    {
        startPage();
        List<VolunteerRecord> list = volunteerRecordService.selectVolunteerRecordListFroApp(volunteerRecord);
        return getDataTable(list);
    }

    /**
     * 根据userId获取个人总工时
     * @param userId
     * @return
     */
    @GetMapping("/userHour")
    public AjaxResult userHour(Long userId)
    {
        VolunteerManHour volunteerManHourDTO = volunteerManHourService.selectVolunteerManHourByUserId(userId);
        AjaxResult ajaxResult = AjaxResult.success();
        ajaxResult.put("data", volunteerManHourDTO);
        return ajaxResult;
    }

    /**
     * 志愿者打卡，签到/签退
     */
    @Transactional(rollbackFor = Exception.class)
    @Log(title = "志愿者签到/签退", businessType = BusinessType.UPDATE)
    @PreAuthorize("@ss.hasPermi('system:role:client')")
    @PostMapping("/signRecord")
    public AjaxResult add(VolunteerRecord volunteerRecord)
    {
        try{
            int count = 0;
            if(null != volunteerRecord && volunteerRecord.getType() == 1){
                //签到
                VolunteerRecord volunteerRecordDTO = new VolunteerRecord();
                volunteerRecordDTO.setUserId(volunteerRecord.getUserId());
                volunteerRecordDTO.setType(volunteerRecord.getType());
                //校验是否存在未签退的
                List<VolunteerRecord> list = volunteerRecordService.selectVolunteerRecordListFroApp(volunteerRecordDTO);
                if(list.size() > 0){
                    AjaxResult ajaxResult = AjaxResult.error();
                    ajaxResult.put("msg", "存在未签退的记录，请先签退");
                    return ajaxResult;
                }
                volunteerRecordDTO.setStartTime(volunteerRecord.getStartTime());
                volunteerRecordDTO.setOperateUserId(volunteerRecord.getOperateUserId());
                volunteerRecordDTO.setOperateLegalName(volunteerRecord.getOperateLegalName());
                count = volunteerRecordService.insertVolunteerRecord(volunteerRecord);
            }else if(null != volunteerRecord && volunteerRecord.getType() == 2){
                //签退
                if(null == volunteerRecord.getId()){
                    AjaxResult ajaxResult = AjaxResult.error();
                    ajaxResult.put("msg", "参数异常");
                    return ajaxResult;
                }
                VolunteerRecord volunteerRecordDTO = new VolunteerRecord();
                volunteerRecordDTO.setId(volunteerRecord.getId());

                //校验是否存在只签到的记录
                volunteerRecordDTO.setType(1L);
                List<VolunteerRecord> list = volunteerRecordService.selectVolunteerRecordListFroApp(volunteerRecordDTO);
                if(list.size() <= 0){
                    AjaxResult ajaxResult = AjaxResult.error();
                    ajaxResult.put("msg", "暂无需要签退的记录");
                    return ajaxResult;
                }

                volunteerRecordDTO.setEndTime(volunteerRecord.getEndTime());
                volunteerRecordDTO.setType(volunteerRecord.getType());
                volunteerRecordDTO.setOperateUserId(volunteerRecord.getOperateUserId());
                volunteerRecordDTO.setOperateLegalName(volunteerRecord.getOperateLegalName());
                volunteerRecordDTO.setRemark(volunteerRecord.getRemark());
                if(null != volunteerRecord.getStatus() && volunteerRecord.getStatus() == 1){
                    volunteerRecordDTO.setStatus(volunteerRecord.getStatus());
                }
                count = volunteerRecordService.updateVolunteerRecord(volunteerRecordDTO);
                if(count > 0 && null != volunteerRecord.getStatus() && volunteerRecord.getStatus() == 1){
                    VolunteerRecord volunteerRecordVo = volunteerRecordService.selectVolunteerRecordById(volunteerRecord.getId());
                    // 计算时间差
                    long diff = volunteerRecordVo.getEndTime().getTime() - volunteerRecordVo.getStartTime().getTime(); // 得到毫秒差
                    long diffMinutes = diff / (60 * 1000); // 转换为分钟
                    VolunteerManHour volunteerManHour = volunteerManHourService.selectVolunteerManHourByUserId(volunteerRecordVo.getUserId());
                    if(null != volunteerManHour){
                        //更新
                        Long totalMinutes = volunteerManHour.getTotalMinutes() + diffMinutes;
                        VolunteerManHour volunteerManHourVo = new VolunteerManHour();
                        volunteerManHourVo.setUserId(volunteerRecordVo.getUserId());
                        volunteerManHourVo.setTotalMinutes(totalMinutes);
                        volunteerManHourService.updateVolunteerManHour(volunteerManHourVo);
                    }else{
                        //新增
                        VolunteerManHour volunteerManHourVo = new VolunteerManHour();
                        volunteerManHourVo.setUserId(volunteerRecordVo.getUserId());
                        volunteerManHourVo.setTotalMinutes(diffMinutes);
                        volunteerManHourService.insertVolunteerManHour(volunteerManHourVo);
                    }
                }
            }

            return toAjax(count);
        }catch (Exception e){
            //强制事务回滚
            TransactionAspectSupport.currentTransactionStatus().setRollbackOnly();
            AjaxResult ajaxResult = AjaxResult.error();
            ajaxResult.put("msg", "操作失败");
            return ajaxResult;
        }
    }

    /**
     * 查询最后一条签到记录是否存在
     * @param volunteerRecord
     * @return
     */
    @PreAuthorize("@ss.hasPermi('system:role:client')")
    @GetMapping("/lastRecordList")
    public AjaxResult lastRecordList(VolunteerRecord volunteerRecord)
    {
        AjaxResult ajaxResult = null;
        volunteerRecord.setType(1L);
        VolunteerRecord volunteerRecordDTO = volunteerRecordService.selectVolunteerLastRecordFroApp(volunteerRecord);
        if(null != volunteerRecordDTO){
            ajaxResult = AjaxResult.success();
            ajaxResult.put("data", volunteerRecordDTO);
        }else{
            ajaxResult = AjaxResult.success();
            ajaxResult.put("data", new Object[]{});
        }
        return ajaxResult;
    }

}
