import request from '@/utils/request'

// 查询券核销记录列表
export function listLog(query) {
  return request({
    url: '/system/couponVerifyLog/list',
    method: 'get',
    params: query
  })
}

// 查询券核销记录详细
export function getLog(id) {
  return request({
    url: '/system/couponVerifyLog/' + id,
    method: 'get'
  })
}

// 新增券核销记录
export function addLog(data) {
  return request({
    url: '/system/couponVerifyLog',
    method: 'post',
    data: data
  })
}

// 修改券核销记录
export function updateLog(data) {
  return request({
    url: '/system/couponVerifyLog',
    method: 'put',
    data: data
  })
}

// 删除券核销记录
export function delLog(id) {
  return request({
    url: '/system/couponVerifyLog/' + id,
    method: 'delete'
  })
}
