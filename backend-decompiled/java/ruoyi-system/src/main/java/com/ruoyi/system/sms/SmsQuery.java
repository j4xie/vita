/*
 * Decompiled with CFR 0.152.
 */
package com.ruoyi.system.sms;

import java.util.Date;

public class SmsQuery {
    private String bizId;
    private String phoneNumber;
    private Date sendDate;
    private Long pageSize;
    private Long currentPage;

    public String getBizId() {
        return this.bizId;
    }

    public void setBizId(String bizId) {
        this.bizId = bizId;
    }

    public String getPhoneNumber() {
        return this.phoneNumber;
    }

    public void setPhoneNumber(String phoneNumber) {
        this.phoneNumber = phoneNumber;
    }

    public Date getSendDate() {
        return this.sendDate;
    }

    public void setSendDate(Date sendDate) {
        this.sendDate = sendDate;
    }

    public Long getPageSize() {
        return this.pageSize;
    }

    public void setPageSize(Long pageSize) {
        this.pageSize = pageSize;
    }

    public Long getCurrentPage() {
        return this.currentPage;
    }

    public void setCurrentPage(Long currentPage) {
        this.currentPage = currentPage;
    }

    public boolean equals(Object o) {
        if (o == this) {
            return true;
        }
        if (!(o instanceof SmsQuery)) {
            return false;
        }
        SmsQuery other = (SmsQuery)o;
        if (!other.canEqual(this)) {
            return false;
        }
        Long this$pageSize = this.getPageSize();
        Long other$pageSize = other.getPageSize();
        if (this$pageSize == null ? other$pageSize != null : !((Object)this$pageSize).equals(other$pageSize)) {
            return false;
        }
        Long this$currentPage = this.getCurrentPage();
        Long other$currentPage = other.getCurrentPage();
        if (this$currentPage == null ? other$currentPage != null : !((Object)this$currentPage).equals(other$currentPage)) {
            return false;
        }
        String this$bizId = this.getBizId();
        String other$bizId = other.getBizId();
        if (this$bizId == null ? other$bizId != null : !this$bizId.equals(other$bizId)) {
            return false;
        }
        String this$phoneNumber = this.getPhoneNumber();
        String other$phoneNumber = other.getPhoneNumber();
        if (this$phoneNumber == null ? other$phoneNumber != null : !this$phoneNumber.equals(other$phoneNumber)) {
            return false;
        }
        Date this$sendDate = this.getSendDate();
        Date other$sendDate = other.getSendDate();
        return !(this$sendDate == null ? other$sendDate != null : !((Object)this$sendDate).equals(other$sendDate));
    }

    protected boolean canEqual(Object other) {
        return other instanceof SmsQuery;
    }

    public int hashCode() {
        int PRIME = 59;
        int result = 1;
        Long $pageSize = this.getPageSize();
        result = result * 59 + ($pageSize == null ? 43 : ((Object)$pageSize).hashCode());
        Long $currentPage = this.getCurrentPage();
        result = result * 59 + ($currentPage == null ? 43 : ((Object)$currentPage).hashCode());
        String $bizId = this.getBizId();
        result = result * 59 + ($bizId == null ? 43 : $bizId.hashCode());
        String $phoneNumber = this.getPhoneNumber();
        result = result * 59 + ($phoneNumber == null ? 43 : $phoneNumber.hashCode());
        Date $sendDate = this.getSendDate();
        result = result * 59 + ($sendDate == null ? 43 : ((Object)$sendDate).hashCode());
        return result;
    }

    public String toString() {
        return "SmsQuery(bizId=" + this.getBizId() + ", phoneNumber=" + this.getPhoneNumber() + ", sendDate=" + this.getSendDate() + ", pageSize=" + this.getPageSize() + ", currentPage=" + this.getCurrentPage() + ")";
    }
}

