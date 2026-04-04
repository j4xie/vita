/*
 * Decompiled with CFR 0.152.
 */
package com.ruoyi.common.utils;

import com.ruoyi.common.enums.CouponStatus;
import com.ruoyi.common.enums.CouponType;
import com.ruoyi.common.enums.UserCouponStatus;
import java.text.SimpleDateFormat;
import java.util.Date;
import java.util.Random;
import java.util.UUID;

public class CommonUtils {
    public static String genRandomNum(int len) {
        int maxNum = 36;
        int count = 0;
        char[] str = new char[]{'A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M', 'N', 'O', 'P', 'Q', 'R', 'S', 'T', 'U', 'V', 'W', 'X', 'Y', 'Z', '0', '1', '2', '3', '4', '5', '6', '7', '8', '9'};
        StringBuffer pwd = new StringBuffer("");
        Random r = new Random();
        while (count < len) {
            int i = Math.abs(r.nextInt(maxNum));
            if (i < 0 || i >= str.length) continue;
            pwd.append(str[i]);
            ++count;
        }
        return pwd.toString();
    }

    public static String getDayStr() {
        Date date = new Date();
        SimpleDateFormat sdf = new SimpleDateFormat("yyyyMMdd");
        String formattedDate = sdf.format(date);
        return formattedDate;
    }

    public static String formatNum(Long number) {
        if (number < 10000L) {
            String formattedNumber = String.format("%04d", number);
            return formattedNumber;
        }
        return String.valueOf(number);
    }

    public static String randomUUID() {
        UUID uuid = UUID.randomUUID();
        return uuid.toString();
    }

    public static String getCouponTypeName(Long code) {
        String result = "";
        if (CouponType.DAI_JIN_QUAN.getCode().equals(code)) {
            result = CouponType.DAI_JIN_QUAN.getLabel();
        }
        return result;
    }

    public static String getUserCouponStatusName(Long code) {
        String result = "";
        if (UserCouponStatus.USED.getValue().equals(code)) {
            result = UserCouponStatus.USED.getName();
        } else if (UserCouponStatus.CANUSE.getValue().equals(code)) {
            result = UserCouponStatus.CANUSE.getName();
        } else if (UserCouponStatus.EXPIRE.getValue().equals(code)) {
            result = UserCouponStatus.EXPIRE.getName();
        }
        return result;
    }

    public static String getCouponStatusName(Long code) {
        String result = "";
        if (CouponStatus.AUDIT.getValue().equals(code)) {
            result = CouponStatus.AUDIT.getName();
        } else if (CouponStatus.AUDIT_PASS.getValue().equals(code)) {
            result = CouponStatus.AUDIT_PASS.getName();
        } else if (CouponStatus.AUDIT_REFUDE.getValue().equals(code)) {
            result = CouponStatus.AUDIT_REFUDE.getName();
        } else if (CouponStatus.OUT_DATE.getValue().equals(code)) {
            result = CouponStatus.OUT_DATE.getName();
        }
        return result;
    }

    public static String checkOrderStatus(Long orderStatus) {
        String result = "";
        if (orderStatus == 1L) {
            result = "\u5f85\u652f\u4ed8";
        } else if (orderStatus == 2L) {
            result = "\u5df2\u652f\u4ed8";
        } else if (orderStatus == 3L) {
            result = "\u5df2\u53d6\u6d88";
        } else if (orderStatus == 4L) {
            result = "\u5df2\u9000\u6b3e";
        } else if (orderStatus == 5L) {
            result = "\u5df2\u5173\u95ed";
        } else if (orderStatus == 6L) {
            result = "\u5f85\u53d1\u8d27";
        } else if (orderStatus == 7L) {
            result = "\u5f85\u6536\u8d27";
        }
        return result;
    }

    public static String checkOrderType(Long orderType) {
        String result = "";
        if (orderType == 1L) {
            result = "\u5151\u6362\u79ef\u5206\u5546\u54c1";
        } else if (orderType == 2L) {
            result = "\u6d3b\u52a8\u652f\u4ed8";
        } else if (orderType == 3L) {
            result = "\u8d2d\u4e70\u4f1a\u5458";
        }
        return result;
    }

    public static String checkPayMode(Long payMode) {
        String result = "";
        if (payMode == 1L) {
            result = "\u7f8e\u5143";
        } else if (payMode == 2L) {
            result = "\u79ef\u5206";
        }
        return result;
    }
}

