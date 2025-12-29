package com.ruoyi.quartz.task;

import com.ruoyi.system.domain.SysOrder;
import com.ruoyi.system.domain.SysUserExCoupon;
import com.ruoyi.system.domain.VolunteerRecord;
import com.ruoyi.system.service.ISysOrderService;
import com.ruoyi.system.service.ISysUserExCouponService;
import com.ruoyi.system.service.IVolunteerRecordService;
import org.apache.http.util.TextUtils;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;

import java.text.SimpleDateFormat;
import java.util.Calendar;
import java.util.Date;
import java.util.List;

/**
 * 定时任务
 */
@Component("commonTask")
public class CommonTask {

    @Autowired
    private IVolunteerRecordService volunteerRecordService;

    @Autowired
    private ISysOrderService sysOrderService;

    @Autowired
    private ISysUserExCouponService sysUserExCouponService;

    /**
     * 定时处理未签退的打卡记录
     * 判断打卡记录，签到时间距当前超过12小时，还未签退的，直接签退并审核拒绝，拒绝原因“未手动签退，请手动补录”
     */
    public void handleSignRecords()
    {
        //---打印标记
        SimpleDateFormat s = new SimpleDateFormat("yyyy-MM-dd HH:mm:ss");
        Date date = new Date();
        System.out.println("打卡记录-执行定时处理打卡记录 " + s.format(date));
        //---
        VolunteerRecord volunteerRecord = new VolunteerRecord();
        volunteerRecord.setType(1L);
        List<VolunteerRecord> list = volunteerRecordService.selectVolunteerRecordListFroApp(volunteerRecord);

        int result = 0;
        if(!list.isEmpty() && list.size() > 0){
            for(int i = 0;i < list.size();i++){
                //判断签到时间距离当前时间
                Date signTime = list.get(i).getStartTime();
                // 获取当前时间
                Calendar calendar = Calendar.getInstance();
                calendar.setTime(new Date()); // 设置当前时间为基准时间
                int offsetTime = 0;
                if(!TextUtils.isEmpty(list.get(i).getTimeOffset())){//存在时差
                    offsetTime = Integer.parseInt(list.get(i).getTimeOffset());
                }
                offsetTime = offsetTime - 12;
                // 设置基准时间为12小时之前
                calendar.add(Calendar.HOUR, offsetTime);
                //calendar.add(Calendar.HOUR, -12);
                Date twelveHoursAgo = calendar.getTime();
                if (signTime.before(twelveHoursAgo)) {
                    //System.out.println("距离当前时间超过12小时");
                    VolunteerRecord volunteerRecordDTO = new VolunteerRecord();
                    volunteerRecordDTO.setId(list.get(i).getId());
                    volunteerRecordDTO.setType(2L);
                    volunteerRecordDTO.setEndTime(date);
                    volunteerRecordDTO.setStatus(2L);
                    volunteerRecordDTO.setRemark("系统自动审核：未手动签退，请手动补录");
                    volunteerRecordDTO.setAuditTime(date);
                    int count = volunteerRecordService.updateVolunteerRecord(volunteerRecordDTO);
                    if(count > 0){
                        result ++;
                    }
                } else {
                    //System.out.println("距离当前时间未超过12小时");
                }
            }
        }
        System.out.println("处理条数：" + result);
    }

    /**
     * 定时处理优惠券有效期、状态
     * 处理待付款订单，超过15分钟未支付，将订单取消
     */
    public void handleCouponStatus(){
        //---打印标记
        SimpleDateFormat s = new SimpleDateFormat("yyyy-MM-dd HH:mm:ss");
        Date date = new Date();
        System.out.println("优惠券状态-执行定时处理打卡记录 " + s.format(date));
        //---
        SysUserExCoupon sysUserExCoupon = new SysUserExCoupon();
        sysUserExCoupon.setStatus(1L);
        sysUserExCoupon.setCurrentTime(new Date());
        List<SysUserExCoupon> sysUserExCouponList = sysUserExCouponService.selectSysUserExCouponList(sysUserExCoupon);
        int result = 0;
        System.out.println("查到需处理优惠券条数：" + sysUserExCouponList.size());
        if(!sysUserExCouponList.isEmpty() && sysUserExCouponList.size() > 0){
            for(int i = 0;i < sysUserExCouponList.size();i++){
                SysUserExCoupon sysUserExCouponDTO = new SysUserExCoupon();
                sysUserExCouponDTO.setId(sysUserExCouponList.get(i).getId());
                sysUserExCouponDTO.setStatus(2L);
                int res = sysUserExCouponService.updateSysUserExCoupon(sysUserExCouponDTO);
                if(res > 0){
                    result ++;
                }
            }
        }
        System.out.println("优惠券处理条数：" + result);
    }

    /**
     * 定时处理订单的状态
     */
    public void handleOrderStatus(){
        //---打印标记
        SimpleDateFormat s = new SimpleDateFormat("yyyy-MM-dd HH:mm:ss");
        Date date = new Date();
        System.out.println("订单状态-执行定时处理打卡记录 " + s.format(date));
        //---
        SysOrder sysOrder = new SysOrder();
        sysOrder.setOrderStatus(1L);
        List<SysOrder> sysOrderList = sysOrderService.selectSysOrderList(sysOrder);
        int result = 0;
        System.out.println("查到需处理订单条数：" + sysOrderList.size());
        if(!sysOrderList.isEmpty() && sysOrderList.size() > 0){
            for(int i = 0;i < sysOrderList.size();i++){
                Date createTime = sysOrderList.get(i).getCreateTime();
                if(isTimeOffsetMinutes(createTime, date, 15)){
                    SysOrder sysOrderDTO = new SysOrder();
                    sysOrderDTO.setId(sysOrderList.get(i).getId());
                    sysOrderDTO.setOrderStatus(3L);
                    int res = sysOrderService.updateSysOrder(sysOrderDTO);
                    if(res > 0){
                        result ++;
                    }
                }
            }
        }
        System.out.println("订单处理条数：" + result);
    }

    /**
     *
     * @param time1
     * @param time2
     * @param offsetTime   时间差,分钟
     * @return
     */
    public static boolean isTimeOffsetMinutes(Date time1, Date time2, long offsetTime) {
        long diff = Math.abs(time1.getTime() - time2.getTime());
        long diffMinutes = diff / (60 * 1000) % 60;
        return diffMinutes > offsetTime;
    }
}
