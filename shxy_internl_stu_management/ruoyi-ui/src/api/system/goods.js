import request from '@/utils/request'

// 查询积分商品列表
export function listGoods(query) {
  return request({
    url: '/system/goods/list',
    method: 'get',
    params: query
  })
}

// 查询积分商品详细
export function getGoods(id) {
  return request({
    url: '/system/goods/' + id,
    method: 'get'
  })
}

// 新增积分商品
export function addGoods(data) {
  return request({
    url: '/system/goods',
    method: 'post',
    data: data
  })
}

// 修改积分商品
export function updateGoods(data) {
  return request({
    url: '/system/goods',
    method: 'put',
    data: data
  })
}

// 删除积分商品
export function delGoods(id) {
  return request({
    url: '/system/goods/' + id,
    method: 'delete'
  })
}
