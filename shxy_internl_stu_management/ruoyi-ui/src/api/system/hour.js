import request from '@/utils/request'

// 查询志愿者总工时列表
export function listHour(query) {
  return request({
    url: '/system/hour/list',
    method: 'get',
    params: query
  })
}

// 查询志愿者总工时详细
export function getHour(userId) {
  return request({
    url: '/system/hour/' + userId,
    method: 'get'
  })
}

// 新增志愿者总工时
export function addHour(data) {
  return request({
    url: '/system/hour',
    method: 'post',
    data: data
  })
}

// 修改志愿者总工时
export function updateHour(data) {
  return request({
    url: '/system/hour',
    method: 'put',
    data: data
  })
}

// 删除志愿者总工时
export function delHour(userId) {
  return request({
    url: '/system/hour/' + userId,
    method: 'delete'
  })
}
