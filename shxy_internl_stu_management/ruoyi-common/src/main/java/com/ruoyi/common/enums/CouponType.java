package com.ruoyi.common.enums;

public enum CouponType {

    DAI_JIN_QUAN(1L, "代金券");//代金券

    private Long code;
    private String label;

    CouponType(Long code, String label) {
        this.code = code;
        this.label = label;
    }

    public Long getCode(){
        return code;
    }

    public String getLabel(){
        return label;
    }

}
