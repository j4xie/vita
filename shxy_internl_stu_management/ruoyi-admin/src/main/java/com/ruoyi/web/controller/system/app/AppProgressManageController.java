package com.ruoyi.web.controller.system.app;

import com.alibaba.fastjson2.JSONArray;
import com.alibaba.fastjson2.JSONObject;
import com.ruoyi.common.annotation.Log;
import com.ruoyi.common.core.controller.BaseController;
import com.ruoyi.common.core.domain.AjaxResult;
import com.ruoyi.common.core.domain.model.LoginUser;
import com.ruoyi.common.core.page.TableDataInfo;
import com.ruoyi.common.enums.BusinessType;
import com.ruoyi.common.utils.DateUtils;
import com.ruoyi.common.utils.SecurityUtils;
import com.ruoyi.common.utils.poi.ExcelUtil;
import com.ruoyi.system.domain.SysOrder;
import com.ruoyi.system.domain.SysProgressInstance;
import com.ruoyi.system.domain.SysProgressNode;
import com.ruoyi.system.domain.SysProgressTemplate;
import com.ruoyi.system.service.ISysProgressInstanceService;
import com.ruoyi.system.service.ISysProgressNodeService;
import com.ruoyi.system.service.ISysProgressTemplateService;
import org.apache.http.util.TextUtils;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.transaction.interceptor.TransactionAspectSupport;
import org.springframework.web.bind.annotation.*;

import javax.servlet.http.HttpServletResponse;
import java.util.List;
import java.util.Objects;

/**
 * 流程管理Controller
 * 
 * @author ruoyi
 * @date 2026-02-28
 */
@RestController
@RequestMapping("/app/progress")
public class AppProgressManageController extends BaseController
{
    @Autowired
    private ISysProgressTemplateService sysProgressTemplateService;

    @Autowired
    private ISysProgressInstanceService sysProgressInstanceService;

    @Autowired
    private ISysProgressNodeService sysProgressNodeService;



    /**
     * 查询流程管理列表
     */
    @PreAuthorize("@ss.hasPermi('system:role:client')")
    @GetMapping("/list")
    public TableDataInfo list(SysProgressTemplate sysProgressTemplate)
    {
        sysProgressTemplate.setEnabled(1);
        List<SysProgressTemplate> list = sysProgressTemplateService.selectSysProgressTemplateList(sysProgressTemplate);
        return getDataTable(list);
    }


    /**
     * 提交审批
     * @param sysProgressInstance
     * @return
     */
    @PreAuthorize("@ss.hasPermi('system:role:client')")
    @Transactional(rollbackFor = Exception.class)
    @PostMapping("/commitProgress")
    public AjaxResult commitProgress(SysProgressInstance sysProgressInstance)
    {
        AjaxResult ajaxResult = null;
        try{
            // 获取当前用户信息
            LoginUser loginUser = SecurityUtils.getLoginUser();
            if (loginUser == null) {
                return AjaxResult.error("用户未登录");
            }

            // 验证参数
            if (null == sysProgressInstance) {
                return AjaxResult.error("参数不能为空");
            }
            if (null == sysProgressInstance.getTemplateId()) {
                return AjaxResult.error("流程模板ID不能为空");
            }
            /*if (sysProgressInstance.getTitle() == null || sysProgressInstance.getTitle().isEmpty()) {
                return AjaxResult.error("审批标题不能为空");
            }*/
            if (null == sysProgressInstance.getFormData()) {
                return AjaxResult.error("提交表单数据不能为空");
            }

            //获取流程模板数据
            SysProgressTemplate sysProgressTemplate = sysProgressTemplateService.selectSysProgressTemplateById(sysProgressInstance.getTemplateId());
            if(null == sysProgressTemplate){
                return AjaxResult.error("流程模板不存在");
            }

            //解析流程模板，验证参数
            String templateContent = sysProgressTemplate.getProgressContent();
            if(TextUtils.isEmpty(templateContent)){
                return AjaxResult.error("流程模板不存在");
            }
            JSONObject jsonObject = JSONObject.parseObject(templateContent);
            JSONObject approvalFormObject = (JSONObject) jsonObject.get("approvalForm");
            int approvalFormCount = (int) approvalFormObject.get("formCount");
            JSONArray approvalFormItems = (JSONArray) approvalFormObject.get("formItems");

            //获取formData数据验证
            //formData数据格式如下
            /*[
                {
                    "id": 1774575917734,
                    "label": "请假时间",
                    "value": "2026-03-21 09:00至2026-03-22 18:00"
                },
                {
                    "id": 1774575917337,
                    "label": "请假原因",
                    "value": "有事"
                }
            ]*/
            String formData = sysProgressInstance.getFormData();
            JSONArray formDataArray = JSONArray.parseArray(formData);
            for(int i = 0;i < approvalFormCount; i++){
                JSONObject items = (JSONObject) approvalFormItems.get(i);
                if(items.getBoolean("required") == true){//必填
                    boolean isInput = false;
                    for(int j = 0;j < formDataArray.size(); j++){
                        System.out.println(((JSONObject)formDataArray.get(j)).getBigInteger("id") + "====" + items.getBigInteger("id"));
                        if(Objects.equals(((JSONObject) formDataArray.get(j)).getBigInteger("id"), items.getBigInteger("id"))){
                            if(!TextUtils.isEmpty(((JSONObject)formDataArray.get(j)).getString("value"))){
                                isInput = true;
                                break;
                            }
                        }
                    }
                    if(!isInput){
                        return AjaxResult.error(items.getString("field") + "不能为空");
                    }
                }
            }

            //设置模板快照
            sysProgressInstance.setSnapshotTemplateName(sysProgressTemplate.getProgressName());
            sysProgressInstance.setSnapshotTemplateContent(sysProgressTemplate.getProgressContent());

            sysProgressInstance.setTitle(sysProgressTemplate.getProgressName());

            // 设置发起人信息
            sysProgressInstance.setPromoterUserId(loginUser.getUserId());
            sysProgressInstance.setPromoterLegalName(loginUser.getUsername());

            // 设置初始状态
            sysProgressInstance.setStatus(1L); // 1-审核中
            sysProgressInstance.setUrgency(1L); // 1-普通
            sysProgressInstance.setCreateTime(DateUtils.getNowDate());
            
            // 保存审批实例
            int instanceResult = sysProgressInstanceService.insertSysProgressInstance(sysProgressInstance);
            if (instanceResult <= 0) {
                return AjaxResult.error("创建审批实例失败");
            }
            
            // 获取流程模板
            /*SysProgressTemplate template = sysProgressTemplateService.selectSysProgressTemplateById(sysProgressInstance.getTemplateId());
            if (template == null) {
                return AjaxResult.error("流程模板不存在");
            }*/
            
            // 解析流程模板，创建流程节点
            // 这里需要根据实际的流程模板结构来解析和创建节点
            // 假设模板中包含流程节点信息
            // 解析流程模板，创建对应的流程节点
            JSONObject approvalProcessObject = (JSONObject) jsonObject.get("approvalProcess");
            int nodeCount = approvalProcessObject.getIntValue("nodeCount");
            JSONArray flowNodes = (JSONArray) approvalProcessObject.get("flowNodes");
            Long firstNodeId = null;
            for(int i = 0; i < nodeCount; i++){
                // 示例：创建第一个审批节点
                SysProgressNode nodeItem = new SysProgressNode();
                nodeItem.setInstanceId(sysProgressInstance.getId());
                nodeItem.setProcessId(((JSONObject)flowNodes.get(i)).getBigInteger("id").toString());
                nodeItem.setType(((JSONObject)flowNodes.get(i)).getString("type")); // 审批节点
                if(!TextUtils.isEmpty(((JSONObject)((JSONObject)flowNodes.get(i)).get("config")).getString("mode"))){
                    nodeItem.setMultiMode(((JSONObject)((JSONObject)flowNodes.get(i)).get("config")).getString("mode")); // 会签/或签
                }
                //nodeItem.setContent(((JSONObject)flowNodes.get(i)).getString("type"));
                nodeItem.setOperateMethod(((JSONObject)((JSONObject)flowNodes.get(i)).get("config")).getString("approver"));
                nodeItem.setOperateId(((JSONObject)((JSONObject)flowNodes.get(i)).get("config")).getLong("operateUsers"));
                if(!TextUtils.isEmpty(((JSONObject)((JSONObject)flowNodes.get(i)).get("config")).getString("emptyAction"))){
                    nodeItem.setEmptyAction(((JSONObject)((JSONObject)flowNodes.get(i)).get("config")).getString("emptyAction"));
                }
                nodeItem.setStatus(1L); // 1-待审核
                nodeItem.setOrderNum((long) (i+1));
                nodeItem.setCreateTime(DateUtils.getNowDate());

                int nodeResult = sysProgressNodeService.insertSysProgressNode(nodeItem);
                if (nodeResult <= 0) {
                    return AjaxResult.error("创建流程节点失败");
                }
                if(i == 0){
                    firstNodeId = nodeItem.getId();
                }
            }
            
            // 更新审批实例的当前节点
            sysProgressInstance.setCurrentNodeId(firstNodeId);
            sysProgressInstanceService.updateSysProgressInstance(sysProgressInstance);
            
            ajaxResult = AjaxResult.success("提交审批成功");
            ajaxResult.put("instanceId", sysProgressInstance.getId());
            return ajaxResult;
        } catch (Exception e) {
            //强制事务回滚
            TransactionAspectSupport.currentTransactionStatus().setRollbackOnly();
            ajaxResult = AjaxResult.error();
            ajaxResult.put("msg", "提交失败：" + e.getMessage());
            return ajaxResult;
        }
    }

    /**
     * 审批列表-用户自己
     * @param sysProgressInstance
     * @return
     */
    @PreAuthorize("@ss.hasPermi('system:role:client')")
    @GetMapping("/approveList")
    public TableDataInfo ApproveList(SysProgressInstance sysProgressInstance)
    {
        startPage();
        sysProgressInstance.setPromoterUserId(getUserId());
        List<SysProgressInstance> list = sysProgressInstanceService.selectSysProgressInstanceList(sysProgressInstance);
        return getDataTable(list);
    }

    /**
     * 审批列表-审批人员用
     * @param sysProgressInstance
     * @return
     */
    @PreAuthorize("@ss.hasPermi('system:role:client')")
    @GetMapping("/manageApproveList")
    public TableDataInfo manageApproveList(SysProgressInstance sysProgressInstance)
    {
        startPage();
        sysProgressInstance.setOperateId(getUserId());
        List<SysProgressInstance> list = sysProgressInstanceService.selectSysProgressInstanceList(sysProgressInstance);
        for(int i = 0; i < list.size(); i++){
            SysProgressNode sysProgressNode = new SysProgressNode();
            sysProgressNode.setInstanceId(list.get(i).getId());
            List<SysProgressNode> sysProgressNodeList = sysProgressNodeService.selectSysProgressNodeList(sysProgressNode);
            list.get(i).setSysProgressNodeList(sysProgressNodeList);
        }
        return getDataTable(list);
    }

    /**
     * 审批操作
     * @param sysProgressNode
     * @return
     */
    @PreAuthorize("@ss.hasPermi('system:role:client')")
    @Transactional(rollbackFor = Exception.class)
    @PostMapping("/approvalOperation")
    public AjaxResult approvalOperation(SysProgressNode sysProgressNode)
    {
        AjaxResult ajaxResult = null;
        try{
            if(null == sysProgressNode){
                ajaxResult = AjaxResult.error("参数缺失");
                return ajaxResult;
            }

            if(sysProgressNode.getStatus() == 1){
                sysProgressNode.setStatus(2L);
            }else if(sysProgressNode.getStatus() == 2){
                sysProgressNode.setStatus(3L);
            }

            int count = sysProgressNodeService.approvalOperationProgressNode(sysProgressNode);
            if(count <= 0){
                ajaxResult = AjaxResult.error("操作失败");
                return ajaxResult;
            }

            SysProgressNode sysProgressNodeDTO= new SysProgressNode();
            sysProgressNodeDTO.setInstanceId(sysProgressNode.getInstanceId());
            List<SysProgressNode> sysProgressNodeList = sysProgressNodeService.selectSysProgressNodeList(sysProgressNodeDTO);
            if(sysProgressNodeList.size() <= 0){
                ajaxResult = AjaxResult.error("审批单异常!");
                return ajaxResult;
            }

            int _index = -1;
            for(int i = 0; i < sysProgressNodeList.size(); i++){
                Long currNodeId = sysProgressNode.getId();
                if(sysProgressNodeList.get(i).getId() == currNodeId){
                    _index = i;
                }
            }
            if(_index >= 0 && _index < sysProgressNodeList.size() - 1){
                //先看看后面还有没有审批节点，如果都是抄送，就直接结束
                boolean isOver = true;
                for(int i = _index + 1; i < sysProgressNodeList.size(); i++){
                    if(sysProgressNodeList.get(i).getType() == "approver"){
                        isOver = false;
                    }
                }
                if(!isOver){
                    //更新当前节点到实例
                    SysProgressInstance sysProgressInstance = new SysProgressInstance();
                    sysProgressInstance.setId(sysProgressNode.getInstanceId());
                    sysProgressInstance.setCurrentNodeId(sysProgressNodeList.get(_index+1).getId());
                    sysProgressInstanceService.updateSysProgressInstance(sysProgressInstance);
                }else{
                    //流程完成，并抄送
                    SysProgressInstance sysProgressInstance = new SysProgressInstance();
                    sysProgressInstance.setId(sysProgressNode.getInstanceId());
                    sysProgressInstance.setCurrentNodeId(sysProgressNodeList.get(_index+1).getId());
                    sysProgressInstance.setStatus(2L);
                    sysProgressInstanceService.updateSysProgressInstance(sysProgressInstance);
                    //抄送 TODO
                }

            }else if(_index >= 0 && _index == sysProgressNodeList.size() - 1){
                //流程完成
                SysProgressInstance sysProgressInstance = new SysProgressInstance();
                sysProgressInstance.setId(sysProgressNode.getInstanceId());
                sysProgressInstance.setCurrentNodeId(sysProgressNodeList.get(_index+1).getId());
                sysProgressInstance.setStatus(2L);
                sysProgressInstanceService.updateSysProgressInstance(sysProgressInstance);
            }

            ajaxResult = AjaxResult.success("操作成功");
            return ajaxResult;
        }catch (Exception e) {
            //强制事务回滚
            TransactionAspectSupport.currentTransactionStatus().setRollbackOnly();
            ajaxResult = AjaxResult.error();
            ajaxResult.put("msg", "审批操作失败：" + e.getMessage());
            return ajaxResult;
        }
    }
}
