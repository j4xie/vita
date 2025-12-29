package com.ruoyi.web.controller.system.app;

import com.ruoyi.common.annotation.Log;
import com.ruoyi.common.core.controller.BaseController;
import com.ruoyi.common.core.domain.AjaxResult;
import com.ruoyi.common.core.page.TableDataInfo;
import com.ruoyi.common.enums.BusinessType;
import com.ruoyi.common.utils.poi.ExcelUtil;
import com.ruoyi.system.domain.Invitation;
import com.ruoyi.system.service.IInvitationService;
import org.apache.http.util.TextUtils;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import javax.servlet.http.HttpServletResponse;
import java.util.List;
import java.util.Random;

/**
 * 邀请码Controller
 * 
 * @author ruoyi
 * @date 2025-08-18
 */
@RestController
@RequestMapping("/app/invitation")
public class AppInvitationController extends BaseController
{
    @Autowired
    private IInvitationService invitationService;

    /**
     * 查询邀请码列表
     */
    @PreAuthorize("@ss.hasPermi('system:role:client')")
    @GetMapping("/list")
    public TableDataInfo list(Invitation invitation)
    {
        startPage();
        List<Invitation> list = invitationService.selectInvitationList(invitation);
        return getDataTable(list);
    }


    /**
     * 获取邀请码详细信息
     */
    @PostMapping("/invInfo")
    public AjaxResult getInfo(Invitation invitation)
    {
        if(null != invitation && null != invitation.getUserId()){
            Invitation invitationDTO = invitationService.selectInvitation(invitation);
            AjaxResult ajaxResult = AjaxResult.success();
            ajaxResult.put("data", invitationDTO);
            return ajaxResult;
        }else{
            AjaxResult ajaxResult = AjaxResult.error();
            return ajaxResult;
        }
    }

    /**
     * 新增邀请码
     */
    //@Log(title = "邀请码", businessType = BusinessType.INSERT)
    @PostMapping("/addInv")
    public AjaxResult add(Invitation invitation)
    {
        Invitation invitationDTO = invitationService.selectInvitation(invitation);
        if(null != invitationDTO){
            invitation.setInvCode(genRandomNum()+invitation.getUserId().toString());
            invitation.setId(invitationDTO.getId());
            return toAjax(invitationService.updateInvitation(invitation));
        }else{
            invitation.setInvCode(genRandomNum()+invitation.getUserId().toString());
            return toAjax(invitationService.insertInvitation(invitation));
        }
    }

    /**
     * 修改邀请码
     */
    //@Log(title = "邀请码", businessType = BusinessType.UPDATE)
    @PostMapping("/resetInv")
    public AjaxResult edit(Invitation invitation)
    {
        invitation.setInvCode(genRandomNum()+invitation.getUserId().toString());
        return toAjax(invitationService.updateInvitation(invitation));
    }

    /**
     * 校验验证码是否正确
     * @param inviteCode
     * @return
     */
    @GetMapping("/checkInviteCode")
    public AjaxResult checkInviteCode(String inviteCode)
    {
        if(!TextUtils.isEmpty(inviteCode)){
            Invitation invitation = new Invitation();
            invitation.setInvCode(inviteCode);
            List<Invitation> list = invitationService.selectInvitationList(invitation);
            if(list.size() <= 0){
                //邀请码不可用
                AjaxResult ajaxResult = AjaxResult.error();
                ajaxResult.put("msg", "邀请码失效");
                ajaxResult.put("data", "0");
                return ajaxResult;
            }else{
                AjaxResult ajaxResult = AjaxResult.success();
                ajaxResult.put("msg", "邀请码有效");
                ajaxResult.put("data", "1");
                return ajaxResult;
            }
        }
        AjaxResult ajaxResult = AjaxResult.error();
        ajaxResult.put("msg", "请输入邀请码");
        ajaxResult.put("data", "0");
        return ajaxResult;
    }

    /**
     * 生成邀请码
     * @return
     */
    public String genRandomNum(){
        int  maxNum = 36;
        int i;
        int count = 0;
        char[] str = { 'A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K',
                'L', 'M', 'N', 'O', 'P', 'Q', 'R', 'S', 'T', 'U', 'V', 'W',
                'X', 'Y', 'Z', '0', '1', '2', '3', '4', '5', '6', '7', '8', '9' };
        StringBuffer pwd = new StringBuffer("");
        Random r = new Random();
        while(count < 8){
            i = Math.abs(r.nextInt(maxNum));
            if (i >= 0 && i < str.length) {
                pwd.append(str[i]);
                count ++;
            }
        }
        return pwd.toString();
    }
}
