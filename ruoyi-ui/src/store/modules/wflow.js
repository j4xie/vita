// wflow 审批流程设计器状态管理
const state = {
  nodeMap: new Map(),
  isEdit: null,
  selectedNode: {},
  selectFormItem: null,
  design: {},
}

const mutations = {
  selectedNode(state, val) {
    state.selectedNode = val
  },
  loadForm(state, val) {
    state.design = val
  },
  setIsEdit(state, val) {
    state.isEdit = val
  }
}

export default {
  state,
  mutations
}
