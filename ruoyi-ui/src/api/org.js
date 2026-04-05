import request from '@/utils/request'

// 查询组织架构树 — 对接 RuoYi 的部门+用户接口
export function getOrgTree(param) {
  // 获取部门树
  return request({
    url: '/system/dept/list',
    method: 'get'
  }).then(res => {
    const depts = res.data || []
    // 同时获取用户列表
    return request({
      url: '/system/user/list',
      method: 'get',
      params: { pageNum: 1, pageSize: 500 }
    }).then(userRes => {
      const users = userRes.rows || []
      // 构建 wflow 期望的树形结构
      const tree = buildOrgTree(depts, users)
      return { data: tree }
    })
  })
}

// 构建组织架构树
function buildOrgTree(depts, users) {
  // 按部门分组用户
  const usersByDept = {}
  users.forEach(u => {
    const deptId = u.deptId || 0
    if (!usersByDept[deptId]) usersByDept[deptId] = []
    usersByDept[deptId].push({
      id: u.userId,
      name: u.nickName || u.userName,
      avatar: u.avatar,
      type: 'user',
      selected: false
    })
  })

  // 构建部门节点
  const deptNodes = depts.map(d => ({
    id: 'dept_' + d.deptId,
    deptId: d.deptId,
    name: d.deptName,
    type: 'dept',
    parentId: d.parentId ? 'dept_' + d.parentId : null,
    children: (usersByDept[d.deptId] || []).concat([])
  }))

  // 简单返回：部门列表 + 每个部门下的用户
  // wflow 的 OrgPicker 组件会处理树形展示
  return deptNodes.length > 0 ? deptNodes : [{
    id: 'dept_0',
    name: '全部人员',
    type: 'dept',
    children: users.map(u => ({
      id: u.userId,
      name: u.nickName || u.userName,
      avatar: u.avatar,
      type: 'user',
      selected: false
    }))
  }]
}

// 查询系统角色
export function getRole() {
  return request({
    url: '/system/role/list',
    method: 'get',
    params: { pageNum: 1, pageSize: 100 }
  }).then(res => {
    const roles = res.rows || []
    return {
      data: roles.map(r => ({
        id: r.roleId,
        name: r.roleName,
        key: r.roleKey
      }))
    }
  })
}

// 搜索人员
export function getUserByName(param) {
  return request({
    url: '/system/user/list',
    method: 'get',
    params: { userName: param.name, nickName: param.name, pageNum: 1, pageSize: 50 }
  }).then(res => {
    const users = res.rows || []
    return {
      data: users.map(u => ({
        id: u.userId,
        name: u.nickName || u.userName,
        avatar: u.avatar,
        type: 'user'
      }))
    }
  })
}

export default {
  getOrgTree, getUserByName, getRole
}
