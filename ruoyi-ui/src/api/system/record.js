import request from '@/utils/request'

// 查询志愿者打卡记录列表
export function listRecord(query) {
  return request({
    url: '/system/record/list',
    method: 'get',
    params: query
  })
}

// 查询志愿者打卡记录详细
export function getRecord(id) {
  return request({
    url: '/system/record/' + id,
    method: 'get'
  })
}

// 新增志愿者打卡记录
export function addRecord(data) {
  return request({
    url: '/system/record',
    method: 'post',
    data: data
  })
}

// 修改志愿者打卡记录
export function updateRecord(data) {
  return request({
    url: '/system/record',
    method: 'put',
    data: data
  })
}

// 删除志愿者打卡记录
export function delRecord(id) {
  return request({
    url: '/system/record/' + id,
    method: 'delete'
  })
}

// 修改志愿者打卡记录
export function auditRecord(data) {
  return request({
    url: '/system/record/audit',
    method: 'post',
    data: data
  })
}
