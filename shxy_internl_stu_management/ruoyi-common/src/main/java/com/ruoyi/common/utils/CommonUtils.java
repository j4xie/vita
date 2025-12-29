package com.ruoyi.common.utils;

import com.ruoyi.common.enums.CouponStatus;
import com.ruoyi.common.enums.CouponType;
import com.ruoyi.common.enums.UserCouponStatus;

import java.text.SimpleDateFormat;
import java.util.Date;
import java.util.Random;
import java.util.UUID;

public class CommonUtils {

    public static String genRandomNum(int len){
        int  maxNum = 36;
        int i;
        int count = 0;
        char[] str = { 'A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K',
                'L', 'M', 'N', 'O', 'P', 'Q', 'R', 'S', 'T', 'U', 'V', 'W',
                'X', 'Y', 'Z', '0', '1', '2', '3', '4', '5', '6', '7', '8', '9' };
        StringBuffer pwd = new StringBuffer("");
        Random r = new Random();
        while(count < len){
            i = Math.abs(r.nextInt(maxNum));
            if (i >= 0 && i < str.length) {
                pwd.append(str[i]);
                count ++;
            }
        }
        return pwd.toString();
    }


    public static String getDayStr(){
        // 获取当前时间
        Date date = new Date();
        // 使用SimpleDateFormat格式化日期
        SimpleDateFormat sdf = new SimpleDateFormat("yyyyMMdd");
        String formattedDate = sdf.format(date);
        return formattedDate;
    }

    public static String formatNum(Long number){
        if(number < 10000){
            String formattedNumber = String.format("%04d", number);
            return formattedNumber;
        }else{
            return String.valueOf(number);
        }
    }

    public static String randomUUID(){
        UUID uuid = UUID.randomUUID();
        //如果数据量非常大，建议加上时间戳！
        return uuid.toString();
    }

    /**
     * 获取券类型
     * @param code
     * @return
     */
    public static String getCouponTypeName(Long code){
        String result = "";
        if(CouponType.DAI_JIN_QUAN.getCode().equals(code)){
            result = CouponType.DAI_JIN_QUAN.getLabel();
        }
        return result;
    }

    /**
     * 获取已发放到用户的优惠券的状态
     * @param code
     * @return
     */
    public static String getUserCouponStatusName(Long code){
        String result = "";
        if(UserCouponStatus.USED.getValue().equals(code)){
            result = UserCouponStatus.USED.getName();
        }else if(UserCouponStatus.CANUSE.getValue().equals(code)){
            result = UserCouponStatus.CANUSE.getName();
        }else if(UserCouponStatus.EXPIRE.getValue().equals(code)){
            result = UserCouponStatus.EXPIRE.getName();
        }
        return result;
    }

    /**
     * 获取优惠券状态
     * @param code
     * @return
     */
    public static String getCouponStatusName(Long code){
        String result = "";
        if(CouponStatus.AUDIT.getValue().equals(code)){
            result = CouponStatus.AUDIT.getName();
        }else if(CouponStatus.AUDIT_PASS.getValue().equals(code)){
            result = CouponStatus.AUDIT_PASS.getName();
        }else if(CouponStatus.AUDIT_REFUDE.getValue().equals(code)){
            result = CouponStatus.AUDIT_REFUDE.getName();
        }else if(CouponStatus.OUT_DATE.getValue().equals(code)){
            result = CouponStatus.OUT_DATE.getName();
        }
        return result;
    }




    //---------------------------订单 start---------------------------------
    /**
     * 订单状态（1-待支付   2-已支付    3-已取消     4-已退款   5-已关闭   6-待发货   7-待收货）
     * @param orderStatus
     * @return
     */
    public static String checkOrderStatus(Long orderStatus){
        String result = "";
        if(orderStatus == 1){
            result = "待支付";
        }else if(orderStatus == 2){
            result = "已支付";
        }else if(orderStatus == 3){
            result = "已取消";
        }else if(orderStatus == 4){
            result = "已退款";
        }else if(orderStatus == 5){
            result = "已关闭";
        }else if(orderStatus == 6){
            result = "待发货";
        }else if(orderStatus == 7){
            result = "待收货";
        }
        return result;
    }

    /**
     * 订单类型（1-积分商城消费   2-活动支付    3-会员等级支付）
     * @param orderType
     * @return
     */
    public static String checkOrderType(Long orderType){
        String result = "";
        if(orderType == 1){
            result = "兑换积分商品";
        }else if(orderType == 2){
            result = "活动支付";
        }else if(orderType == 3){
            result = "购买会员";
        }
        return result;
    }

    /**
     * 消费方式（1-金额   2-积分）
     * @param payMode
     * @return
     */
    public static String checkPayMode(Long payMode){
        String result = "";
        if(payMode == 1){
            result = "美元";
        }else if(payMode == 2){
            result = "积分";
        }
        return result;
    }
    //---------------------------订单 end---------------------------------
}
