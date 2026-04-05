import request from '@/utils/request'

// 查询用户数据积分等记录列表
export function listLog(query) {
  return request({
    url: '/system/log/list',
    method: 'get',
    params: query
  })
}

// 查询用户数据积分等记录详细
export function getLog(userId) {
  return request({
    url: '/system/log/' + userId,
    method: 'get'
  })
}

// 新增用户数据积分等记录
export function addLog(data) {
  return request({
    url: '/system/log',
    method: 'post',
    data: data
  })
}

// 修改用户数据积分等记录
export function updateLog(data) {
  return request({
    url: '/system/log',
    method: 'put',
    data: data
  })
}

// 删除用户数据积分等记录
export function delLog(userId) {
  return request({
    url: '/system/log/' + userId,
    method: 'delete'
  })
}
