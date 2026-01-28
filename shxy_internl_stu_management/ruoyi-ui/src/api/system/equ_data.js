import request from '@/utils/request'

// 查询核心权益管理列表
export function listData(query) {
  return request({
    url: '/system/equData/list',
    method: 'get',
    params: query
  })
}

// 查询核心权益管理详细
export function getData(id) {
  return request({
    url: '/system/equData/' + id,
    method: 'get'
  })
}

// 新增核心权益管理
export function addData(data) {
  return request({
    url: '/system/equData',
    method: 'post',
    data: data
  })
}

// 修改核心权益管理
export function updateData(data) {
  return request({
    url: '/system/equData',
    method: 'put',
    data: data
  })
}

// 删除核心权益管理
export function delData(id) {
  return request({
    url: '/system/equData/' + id,
    method: 'delete'
  })
}
