import request from '@/utils/request'

// 查询邀请码列表
export function listInvitation(query) {
  return request({
    url: '/system/invitation/list',
    method: 'get',
    params: query
  })
}

// 查询邀请码详细
export function getInvitation(id) {
  return request({
    url: '/system/invitation/' + id,
    method: 'get'
  })
}

// 新增邀请码
export function addInvitation(data) {
  return request({
    url: '/system/invitation',
    method: 'post',
    data: data
  })
}

// 修改邀请码
export function updateInvitation(data) {
  return request({
    url: '/system/invitation',
    method: 'put',
    data: data
  })
}

// 删除邀请码
export function delInvitation(id) {
  return request({
    url: '/system/invitation/' + id,
    method: 'delete'
  })
}

//重新生成邀请码
export function resetInvitation(data) {
  return request({
    url: '/system/invitation/resetInv',
    method: 'put',
    data: data
  })
}