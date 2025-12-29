import request from '@/utils/request'

// 查询商品分类列表
export function listClassify(query) {
  return request({
    url: '/system/classify/list',
    method: 'get',
    params: query
  })
}

// 查询商品分类详细
export function getClassify(id) {
  return request({
    url: '/system/classify/' + id,
    method: 'get'
  })
}

// 新增商品分类
export function addClassify(data) {
  return request({
    url: '/system/classify',
    method: 'post',
    data: data
  })
}

// 修改商品分类
export function updateClassify(data) {
  return request({
    url: '/system/classify',
    method: 'put',
    data: data
  })
}

// 删除商品分类
export function delClassify(id) {
  return request({
    url: '/system/classify/' + id,
    method: 'delete'
  })
}
