import request from '@/utils/request'

// 查询用户关联优惠券列表
export function listCoupon(query) {
  return request({
    url: '/system/userExCoupon/list',
    method: 'get',
    params: query
  })
}

// 查询用户关联优惠券详细
export function getCoupon(id) {
  return request({
    url: '/system/userExCoupon/' + id,
    method: 'get'
  })
}

// 新增用户关联优惠券
export function addCoupon(data) {
  return request({
    url: '/system/userExCoupon',
    method: 'post',
    data: data
  })
}

// 修改用户关联优惠券
export function updateCoupon(data) {
  return request({
    url: '/system/userExCoupon',
    method: 'put',
    data: data
  })
}

// 删除用户关联优惠券
export function delCoupon(id) {
  return request({
    url: '/system/userExCoupon/' + id,
    method: 'delete'
  })
}
