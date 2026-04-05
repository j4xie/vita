import request from '@/utils/request'

// 查询活动模板列表
export function listModel(query) {
  return request({
    url: '/system/model/list',
    method: 'get',
    params: query
  })
}

// 查询活动模板详细
export function getModel(id) {
  return request({
    url: '/system/model/' + id,
    method: 'get'
  })
}

// 新增活动模板
export function addModel(data) {
  return request({
    url: '/system/model',
    method: 'post',
    data: data
  })
}

// 修改活动模板
export function updateModel(data) {
  return request({
    url: '/system/model',
    method: 'put',
    data: data
  })
}

// 删除活动模板
export function delModel(id) {
  return request({
    url: '/system/model/' + id,
    method: 'delete'
  })
}
