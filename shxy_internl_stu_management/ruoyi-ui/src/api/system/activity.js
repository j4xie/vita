import request from '@/utils/request'

// 查询活动列表
export function listActivity(query) {
  return request({
    url: '/system/activity/list',
    method: 'get',
    params: query
  })
}

// 查询活动详细
export function getActivity(id) {
  return request({
    url: '/system/activity/' + id,
    method: 'get'
  })
}

// 新增活动
export function addActivity(data) {
  return request({
    url: '/system/activity',
    method: 'post',
    data: data
  })
}

// 修改活动
export function updateActivity(data) {
  return request({
    url: '/system/activity',
    method: 'put',
    data: data
  })
}

// 删除活动
export function delActivity(id) {
  return request({
    url: '/system/activity/' + id,
    method: 'delete'
  })
}


// 查询活动报名列表
export function actSignList(query) {
  return request({
    url: '/system/activity/actSignList',
    method: 'get',
    params: query
  })
}

// 查询活动表单模板列表
export function listModel(query) {
  return request({
    url: '/system/model/list',
    method: 'get',
    params: query
  })
}

// 学校列表
export function listSchool(query) {
  return request({
    url: '/system/dept/schoolList',
    method: 'get',
    params: query
  })
}