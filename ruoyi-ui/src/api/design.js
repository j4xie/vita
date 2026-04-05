import request from '@/utils/request'

// 查询流程模板列表（作为表单分组）
export function getFormGroups() {
  return request({
    url: '/system/progressType/list',
    method: 'get'
  }).then(res => {
    // 转换为 wflow 期望的格式
    const types = res.rows || res.data || []
    return {
      data: types.map(t => ({
        id: t.id,
        name: t.name,
        items: []
      }))
    }
  })
}

export function groupItemsSort(param) {
  return Promise.resolve({ data: true })
}

export function updateGroup(param, method) {
  return Promise.resolve({ data: true })
}

export function getGroup() {
  return getFormGroups()
}

export function updateForm(param) {
  return request({
    url: '/system/template',
    method: 'put',
    data: param
  })
}

export function createForm(param) {
  // 将 wflow 的 design 数据转换为后端格式
  const submitData = {
    progressName: param.formName || param.name || '新建流程',
    typeId: param.groupId || null,
    progressDesc: param.remark || '',
    progressContent: JSON.stringify({
      approvalForm: { formItems: param.formItems || [] },
      approvalProcess: { process: param.process || {} },
      settings: param.settings || {}
    }),
    enabled: 1,
    notifyType: (param.settings && param.settings.notify && param.settings.notify.type) || 'APP',
    notifyTitle: (param.settings && param.settings.notify && param.settings.notify.title) || '流程通知'
  }
  return request({
    url: '/system/template',
    method: 'post',
    data: submitData
  })
}

// 查询模板详情
export function getFormDetail(id) {
  return request({
    url: '/system/template/' + id,
    method: 'get'
  }).then(res => {
    const data = res.data
    // 解析 progressContent 并转换为 wflow 格式
    let content = {}
    try {
      content = JSON.parse(data.progressContent || '{}')
    } catch (e) {
      console.warn('解析 progressContent 失败:', e)
    }
    return {
      data: {
        formId: data.id,
        formName: data.progressName,
        groupId: data.typeId,
        remark: data.progressDesc,
        formItems: (content.approvalForm && content.approvalForm.formItems) || [],
        process: (content.approvalProcess && content.approvalProcess.process) || {
          id: 'root',
          type: 'ROOT',
          name: '发起人',
          props: { assignedUser: [], formPerms: [] },
          children: {}
        },
        settings: content.settings || {
          commiter: [],
          admin: [],
          sign: false,
          notify: { type: data.notifyType || 'APP', title: data.notifyTitle || '流程通知' }
        }
      }
    }
  })
}

// 更新模板详情
export function updateFormDetail(param) {
  const submitData = {
    id: param.formId,
    progressName: param.formName || param.name,
    typeId: param.groupId,
    progressDesc: param.remark || '',
    progressContent: JSON.stringify({
      approvalForm: { formItems: param.formItems || [] },
      approvalProcess: { process: param.process || {} },
      settings: param.settings || {}
    }),
    enabled: 1,
    notifyType: (param.settings && param.settings.notify && param.settings.notify.type) || 'APP',
    notifyTitle: (param.settings && param.settings.notify && param.settings.notify.title) || '流程通知'
  }
  return request({
    url: '/system/template',
    method: 'put',
    data: submitData
  })
}

export default {
  getFormGroups, groupItemsSort, createForm, getFormDetail,
  updateGroup, getGroup, updateForm, updateFormDetail
}
