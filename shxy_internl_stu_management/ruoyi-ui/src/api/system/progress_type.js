import request from '@/utils/request'

// 查询流程分类列表
export function listType(query) {
  return request({
    url: '/system/progressType/list',
    method: 'get',
    params: query
  })
}

// 查询流程分类详细
export function getType(id) {
  return request({
    url: '/system/progressType/' + id,
    method: 'get'
  })
}

// 新增流程分类
export function addType(data) {
  return request({
    url: '/system/progressType',
    method: 'post',
    data: data
  })
}

// 修改流程分类
export function updateType(data) {
  return request({
    url: '/system/progressType',
    method: 'put',
    data: data
  })
}

// 删除流程分类
export function delType(id) {
  return request({
    url: '/system/progressType/' + id,
    method: 'delete'
  })
}
