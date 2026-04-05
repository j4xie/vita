import request from '@/utils/request'

// 查询商户列表
export function listMerchant(query) {
  return request({
    url: '/system/merchant/list',
    method: 'get',
    params: query
  })
}

// 查询商户详细
export function getMerchant(id) {
  return request({
    url: '/system/merchant/' + id,
    method: 'get'
  })
}

// 新增商户
export function addMerchant(data) {
  return request({
    url: '/system/merchant',
    method: 'post',
    data: data
  })
}

// 修改商户
export function updateMerchant(data) {
  return request({
    url: '/system/merchant',
    method: 'put',
    data: data
  })
}

// 审核商户
export function auditMerchant(data) {
  return request({
    url: '/system/merchant/audit',
    method: 'post',
    data: data
  })
}

// 删除商户
export function delMerchant(id) {
  return request({
    url: '/system/merchant/' + id,
    method: 'delete'
  })
}


// 查询学校列表
export function listSchool(query) {
  return request({
    url: '/system/dept/schoolList',
    method: 'get',
    params: query
  })
}