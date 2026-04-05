import request from '@/utils/request'

// 查询活动类型列表
export function listType(query) {
  return request({
    url: '/system/type/list',
    method: 'get',
    params: query
  })
}

// 查询活动类型列表
export function allListType(query) {
  return request({
    url: '/system/type/allList',
    method: 'get',
    params: query
  })
}

// 查询活动类型详细
export function getType(id) {
  return request({
    url: '/system/type/' + id,
    method: 'get'
  })
}

// 新增活动类型
export function addType(data) {
  return request({
    url: '/system/type',
    method: 'post',
    data: data
  })
}

// 修改活动类型
export function updateType(data) {
  return request({
    url: '/system/type',
    method: 'put',
    data: data
  })
}

// 删除活动类型
export function delType(id) {
  return request({
    url: '/system/type/' + id,
    method: 'delete'
  })
}
