import Vue from 'vue'
import Vuex from 'vuex'
import app from './modules/app'
import dict from './modules/dict'
import user from './modules/user'
import tagsView from './modules/tagsView'
import permission from './modules/permission'
import settings from './modules/settings'
import getters from './getters'

Vue.use(Vuex)

const store = new Vuex.Store({
  // wflow 的 state 和 mutations 放在根级别，因为 wflow 组件通过 $store.state.design 直接访问
  state: {
    nodeMap: new Map(),
    isEdit: null,
    selectedNode: {},
    selectFormItem: null,
    design: {},
  },
  mutations: {
    selectedNode(state, val) {
      state.selectedNode = val
    },
    loadForm(state, val) {
      state.design = val
    },
    setIsEdit(state, val) {
      state.isEdit = val
    }
  },
  modules: {
    app,
    dict,
    user,
    tagsView,
    permission,
    settings
  },
  getters
})

export default store
