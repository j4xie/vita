import request from '@/utils/request'

// 查询审批实例列表
export function listInstance(query) {
  return request({
    url: '/system/instance/list',
    method: 'get',
    params: query
  })
}

// 查询审批实例详细
export function getInstance(id) {
  return request({
    url: '/system/instance/' + id,
    method: 'get'
  })
}

// 新增审批实例
export function addInstance(data) {
  return request({
    url: '/system/instance',
    method: 'post',
    data: data
  })
}

// 修改审批实例
export function updateInstance(data) {
  return request({
    url: '/system/instance',
    method: 'put',
    data: data
  })
}

// 删除审批实例
export function delInstance(id) {
  return request({
    url: '/system/instance/' + id,
    method: 'delete'
  })
}
