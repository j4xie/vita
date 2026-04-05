import request from '@/utils/request'

export function listProgressType(query) {
  return request({
    url: '/system/progressType/list',
    method: 'get',
    params: query
  })
}

export function getProgressType(id) {
  return request({
    url: '/system/progressType/' + id,
    method: 'get'
  })
}

export function addProgressType(data) {
  return request({
    url: '/system/progressType',
    method: 'post',
    data: data
  })
}

export function updateProgressType(data) {
  return request({
    url: '/system/progressType',
    method: 'put',
    data: data
  })
}

export function delProgressType(id) {
  return request({
    url: '/system/progressType/' + id,
    method: 'delete'
  })
}
