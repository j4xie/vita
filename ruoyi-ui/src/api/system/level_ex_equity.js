import request from '@/utils/request'

// 查询会员等级关联权益列表
export function listEquity(query) {
  return request({
    url: '/system/levelExEquity/list',
    method: 'get',
    params: query
  })
}

// 查询会员等级关联权益详细
export function getEquity(levelId) {
  return request({
    url: '/system/levelExEquity/' + levelId,
    method: 'get'
  })
}

// 新增会员等级关联权益
export function addEquity(data) {
  return request({
    url: '/system/levelExEquity',
    method: 'post',
    data: data
  })
}

// 修改会员等级关联权益
export function updateEquity(data) {
  return request({
    url: '/system/levelExEquity',
    method: 'put',
    data: data
  })
}

// 删除会员等级关联权益
export function delEquity(levelId) {
  return request({
    url: '/system/levelExEquity/' + levelId,
    method: 'delete'
  })
}
