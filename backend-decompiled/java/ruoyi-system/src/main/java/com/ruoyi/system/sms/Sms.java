/*
 * Decompiled with CFR 0.152.
 */
package com.ruoyi.system.sms;

public class Sms {
    private String phoneNumbers;
    private String templateParam;
    private String outId;
    private String templateCode;

    public String getPhoneNumbers() {
        return this.phoneNumbers;
    }

    public void setPhoneNumbers(String phoneNumbers) {
        this.phoneNumbers = phoneNumbers;
    }

    public String getTemplateParam() {
        return this.templateParam;
    }

    public void setTemplateParam(String templateParam) {
        this.templateParam = templateParam;
    }

    public String getOutId() {
        return this.outId;
    }

    public void setOutId(String outId) {
        this.outId = outId;
    }

    public String getTemplateCode() {
        return this.templateCode;
    }

    public void setTemplateCode(String templateCode) {
        this.templateCode = templateCode;
    }

    public boolean equals(Object o) {
        if (o == this) {
            return true;
        }
        if (!(o instanceof Sms)) {
            return false;
        }
        Sms other = (Sms)o;
        if (!other.canEqual(this)) {
            return false;
        }
        String this$phoneNumbers = this.getPhoneNumbers();
        String other$phoneNumbers = other.getPhoneNumbers();
        if (this$phoneNumbers == null ? other$phoneNumbers != null : !this$phoneNumbers.equals(other$phoneNumbers)) {
            return false;
        }
        String this$templateParam = this.getTemplateParam();
        String other$templateParam = other.getTemplateParam();
        if (this$templateParam == null ? other$templateParam != null : !this$templateParam.equals(other$templateParam)) {
            return false;
        }
        String this$outId = this.getOutId();
        String other$outId = other.getOutId();
        if (this$outId == null ? other$outId != null : !this$outId.equals(other$outId)) {
            return false;
        }
        String this$templateCode = this.getTemplateCode();
        String other$templateCode = other.getTemplateCode();
        return !(this$templateCode == null ? other$templateCode != null : !this$templateCode.equals(other$templateCode));
    }

    protected boolean canEqual(Object other) {
        return other instanceof Sms;
    }

    public int hashCode() {
        int PRIME = 59;
        int result = 1;
        String $phoneNumbers = this.getPhoneNumbers();
        result = result * 59 + ($phoneNumbers == null ? 43 : $phoneNumbers.hashCode());
        String $templateParam = this.getTemplateParam();
        result = result * 59 + ($templateParam == null ? 43 : $templateParam.hashCode());
        String $outId = this.getOutId();
        result = result * 59 + ($outId == null ? 43 : $outId.hashCode());
        String $templateCode = this.getTemplateCode();
        result = result * 59 + ($templateCode == null ? 43 : $templateCode.hashCode());
        return result;
    }

    public String toString() {
        return "Sms(phoneNumbers=" + this.getPhoneNumbers() + ", templateParam=" + this.getTemplateParam() + ", outId=" + this.getOutId() + ", templateCode=" + this.getTemplateCode() + ")";
    }
}

