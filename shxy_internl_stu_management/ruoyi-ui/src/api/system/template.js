import request from '@/utils/request'

// 查询流程管理列表
export function listManage(query) {
  return request({
    url: '/system/template/list',
    method: 'get',
    params: query
  })
}

// 查询流程管理详细
export function getManage(id) {
  return request({
    url: '/system/template/' + id,
    method: 'get'
  })
}

// 新增流程管理
export function addManage(data) {
  return request({
    url: '/system/template',
    method: 'post',
    data: data
  })
}

// 修改流程管理
export function updateManage(data) {
  return request({
    url: '/system/template',
    method: 'put',
    data: data
  })
}

// 删除流程管理
export function delManage(id) {
  return request({
    url: '/system/template/' + id,
    method: 'delete'
  })
}
