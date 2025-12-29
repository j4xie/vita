package com.ruoyi.web.controller.system;

import java.util.List;
import java.util.Random;
import javax.servlet.http.HttpServletResponse;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import com.ruoyi.common.annotation.Log;
import com.ruoyi.common.core.controller.BaseController;
import com.ruoyi.common.core.domain.AjaxResult;
import com.ruoyi.common.enums.BusinessType;
import com.ruoyi.system.domain.Invitation;
import com.ruoyi.system.service.IInvitationService;
import com.ruoyi.common.utils.poi.ExcelUtil;
import com.ruoyi.common.core.page.TableDataInfo;

/**
 * 邀请码Controller
 * 
 * @author ruoyi
 * @date 2025-08-18
 */
@RestController
@RequestMapping("/system/invitation")
public class InvitationController extends BaseController
{
    @Autowired
    private IInvitationService invitationService;

    /**
     * 查询邀请码列表
     */
    @PreAuthorize("@ss.hasPermi('system:invitation:list')")
    @GetMapping("/list")
    public TableDataInfo list(Invitation invitation)
    {
        startPage();
        List<Invitation> list = invitationService.selectInvitationList(invitation);
        return getDataTable(list);
    }

    /**
     * 导出邀请码列表
     */
    @PreAuthorize("@ss.hasPermi('system:invitation:export')")
    @Log(title = "邀请码", businessType = BusinessType.EXPORT)
    @PostMapping("/export")
    public void export(HttpServletResponse response, Invitation invitation)
    {
        List<Invitation> list = invitationService.selectInvitationList(invitation);
        ExcelUtil<Invitation> util = new ExcelUtil<Invitation>(Invitation.class);
        util.exportExcel(response, list, "邀请码数据");
    }

    /**
     * 获取邀请码详细信息
     */
    @PreAuthorize("@ss.hasPermi('system:invitation:query')")
    @GetMapping(value = "/{id}")
    public AjaxResult getInfo(@PathVariable("id") Long id)
    {
        return success(invitationService.selectInvitationById(id));
    }

    /**
     * 新增邀请码
     */
    @PreAuthorize("@ss.hasPermi('system:invitation:add')")
    @Log(title = "邀请码", businessType = BusinessType.INSERT)
    @PostMapping
    public AjaxResult add(@RequestBody Invitation invitation)
    {
        return toAjax(invitationService.insertInvitation(invitation));
    }

    /**
     * 修改邀请码
     */
    @PreAuthorize("@ss.hasPermi('system:invitation:edit')")
    @Log(title = "邀请码", businessType = BusinessType.UPDATE)
    @PutMapping
    public AjaxResult edit(@RequestBody Invitation invitation)
    {
        return toAjax(invitationService.updateInvitation(invitation));
    }

    /**
     * 删除邀请码
     */
    @PreAuthorize("@ss.hasPermi('system:invitation:remove')")
    @Log(title = "邀请码", businessType = BusinessType.DELETE)
	@DeleteMapping("/{ids}")
    public AjaxResult remove(@PathVariable Long[] ids)
    {
        return toAjax(invitationService.deleteInvitationByIds(ids));
    }


    /**
     * 重新生成邀请码
     */
    @PreAuthorize("@ss.hasPermi('system:invitation:edit')")
    @Log(title = "邀请码", businessType = BusinessType.UPDATE)
    @PutMapping("/resetInv")
    public AjaxResult resetInv(@RequestBody Invitation invitation)
    {
        invitation.setInvCode(genRandomNum()+invitation.getUserId().toString());
        return toAjax(invitationService.updateInvitation(invitation));
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
