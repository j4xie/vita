import request from '@/utils/request'

// 查询优惠券列表
export function listCoupon(query) {
  return request({
    url: '/system/coupon/list',
    method: 'get',
    params: query
  })
}

// 查询优惠券详细
export function getCoupon(id) {
  return request({
    url: '/system/coupon/' + id,
    method: 'get'
  })
}

// 新增优惠券
export function addCoupon(data) {
  return request({
    url: '/system/coupon',
    method: 'post',
    data: data
  })
}

// 修改优惠券
export function updateCoupon(data) {
  return request({
    url: '/system/coupon',
    method: 'put',
    data: data
  })
}

/**
 * 审核优惠券
 * @param {*} data 
 * @returns 
 */
export function auditCoupon(data) {
  return request({
    url: '/system/coupon/audit',
    method: 'post',
    data: data
  })
}

// 删除优惠券
export function delCoupon(id) {
  return request({
    url: '/system/coupon/' + id,
    method: 'delete'
  })
}

/**
 * 发放优惠券
 * @param {*} data 
 * @returns 
 */
export function issueCoupons(data) {
  return request({
    url: '/system/userExCoupon/issueCoupons',
    method: 'post',
    data: data
  })
}

// 查询全部可用商户列表
export function allMerchantList(query) {
  return request({
    url: '/system/merchant/allList',
    method: 'get',
    params: query
  })
}