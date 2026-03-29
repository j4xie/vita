<template>
  <div class="container">
    <div class="left-board">
      <div class="logo-wrapper">
        <div class="logo">
          <img :src="logo" alt="logo"> 表单设计器
        </div>
      </div>
      <el-scrollbar class="left-scrollbar">
        <div class="components-list">
          <div class="components-title">
            <svg-icon icon-class="component" />常用组件
          </div>
          <draggable
            class="components-draggable"
            :list="processedCommonComponents"
            :group="{ name: 'componentsGroup', pull: 'clone', put: false }"
            :clone="cloneComponent"
            draggable=".components-item"
            :sort="false"
            @end="onEnd"
          >
            <div
              v-for="(element, index) in processedCommonComponents" :key="index" class="components-item"
              @click="addComponent(element)"
            >
              <div class="components-body">
                <svg-icon :icon-class="element.tagIcon" />
                {{ element.label }}
              </div>
            </div>
          </draggable>
          <div class="components-title">
            <svg-icon icon-class="component" />输入型组件
          </div>
          <draggable
            class="components-draggable"
            :list="processedInputComponents"
            :group="{ name: 'componentsGroup', pull: 'clone', put: false }"
            :clone="cloneComponent"
            draggable=".components-item"
            :sort="false"
            @end="onEnd"
          >
            <div
              v-for="(element, index) in processedInputComponents" :key="index" class="components-item"
              @click="addComponent(element)"
            >
              <div class="components-body">
                <svg-icon :icon-class="element.tagIcon" />
                {{ element.label }}
              </div>
            </div>
          </draggable>
          <div class="components-title">
            <svg-icon icon-class="component" />选择型组件
          </div>
          <draggable
            class="components-draggable"
            :list="processedSelectComponents"
            :group="{ name: 'componentsGroup', pull: 'clone', put: false }"
            :clone="cloneComponent"
            draggable=".components-item"
            :sort="false"
            @end="onEnd"
          >
            <div
              v-for="(element, index) in processedSelectComponents" :key="index" class="components-item"
              @click="addComponent(element)"
            >
              <div class="components-body">
                <svg-icon :icon-class="element.tagIcon" />
                {{ element.label }}
              </div>
            </div>
          </draggable>
          <div class="components-title">
            <svg-icon icon-class="component" /> 布局型组件
          </div>
          <draggable
            class="components-draggable" :list="layoutComponents"
            :group="{ name: 'componentsGroup', pull: 'clone', put: false }" :clone="cloneComponent"
            draggable=".components-item" :sort="false" @end="onEnd"
          >
            <div
              v-for="(element, index) in layoutComponents" :key="index" class="components-item"
              @click="addComponent(element)"
            >
              <div class="components-body">
                <svg-icon :icon-class="element.tagIcon" />
                {{ element.label }}
              </div>
            </div>
          </draggable>
        </div>
      </el-scrollbar>
    </div>

    <div class="center-board">
      <div class="action-bar">
        <div class="left-side">
          <span class="form-label">
            <span class="required-mark">*</span>表单模板名称：
          </span>
          <el-input 
            v-model="name" 
            placeholder="请输入表单模板名称" 
            clearable
            class="form-name-input"
            style="width: 300px;"
            @blur="validateName"
          >
          </el-input>
        </div>
        <div class="right-side">
          <el-button class="delete-btn" icon="el-icon-delete" type="text" @click="empty">
            清空
          </el-button>
          <!-- 添加页面按钮 -->
          <el-button class="add-page-btn" icon="el-icon-plus" type="primary" @click="addPage">
            添加页面
          </el-button>
          <!-- 添加提交表单按钮 -->
          <el-button class="submit-btn" icon="el-icon-upload" type="primary" @click="submitForm">
            提交表单
          </el-button>
        </div>
      </div>
      <!-- 分页标签页 -->
      <div class="page-tabs">
        <el-tabs v-model="currentPage" type="border-card" @tab-click="handlePageChange">
          <el-tab-pane 
            v-for="page in pages" 
            :key="page.id" 
            :label="page.name" 
            :name="page.id"
          >
            <div class="page-tab-content">
              <el-scrollbar class="center-scrollbar">
                <el-row class="center-board-row" :gutter="formConf.gutter">
                  <el-form
                    :size="formConf.size"
                    :label-position="formConf.labelPosition"
                    :disabled="formConf.disabled"
                    :label-width="formConf.labelWidth + 'px'"
                    :style="formStyle"
                    ref="form"
                  >
                    <draggable class="drawing-board" :list="currentPageComponents" :animation="340" group="componentsGroup">
                      <!-- <draggable-item
                        v-for="(element, index) in currentPageComponents"
                        :key="element.renderKey"
                        :drawing-list="currentPageComponents"
                        :element="element"
                        :index="index"
                        :active-id="activeId"
                        :form-conf="formConf"
                        @activeItem="activeFormItem"
                        @copyItem="drawingItemCopy"
                        @deleteItem="drawingItemDelete"
                      /> -->
                      <div v-for="(element, index) in currentPageComponents" :key="element.renderKey" class="components-item">
                        {{ element.label }}
                      </div>
                    </draggable>
                    <div v-show="!currentPageComponents.length" class="empty-info">
                      从左侧拖入或点选组件进行表单设计
                    </div>
                  </el-form>
                </el-row>
              </el-scrollbar>
            </div>
          </el-tab-pane>
        </el-tabs>
      </div>
    </div>

    <!-- <right-panel
      :active-data="activeData"
      :form-conf="formConf"
      :show-field="!!currentPageComponents.length"
      :form-fields="formFields"
      :appearance="appearance"
      @tag-change="tagChange"
    />

    <code-type-dialog
      :visible.sync="dialogVisible"
      title="选择生成类型"
      :show-file-name="showFileName"
      @confirm="generate"
    /> -->
    <input id="copyNode" type="hidden">
  </div>
</template>

<script>
import draggable from 'vuedraggable'
import beautifier from 'js-beautify'
import ClipboardJS from 'clipboard'
import render from '@/utils/generator/render'
// import RightPanel from '@/views/tool/build/RightPanel'
import { processedInputComponents, processedSelectComponents, layoutComponents, formConf, processedCommonComponents } from '@/utils/generator/config'
import { beautifierConf, titleCase } from '@/utils/index'
import { makeUpHtml, vueTemplate, vueScript, cssStyle } from '@/utils/generator/html'
import { makeUpJs } from '@/utils/generator/js'
import { makeUpCss } from '@/utils/generator/css'
import drawingDefault from '@/utils/generator/drawingDefault'
import logo from '@/assets/logo/logo.png'
// import CodeTypeDialog from '@/views/tool/build/CodeTypeDialog'
// import DraggableItem from '@/views/tool/build/DraggableItem'
import { listModel, getModel, delModel, addModel, updateModel } from "@/api/system/model"

let oldActiveId
let tempActiveData

export default {
  components: {
    draggable,
    render
    // RightPanel,
    // CodeTypeDialog,
    // DraggableItem
  },
  data() {
    return {
      logo,
      idGlobal: 100,
      formConf,
      processedInputComponents,
      processedSelectComponents,
      layoutComponents,
      processedCommonComponents,
      labelWidth: 100,
      pages: [{
        id: '1',
        name: '页面 1',
        components: drawingDefault
      }],
      currentPage: '1',
      drawingData: {},
      activeId: drawingDefault[0].formId,
      drawerVisible: false,
      formData: {},
      dialogVisible: false,
      generateConf: null,
      showFileName: false,
      operationType: '',
      activeData: drawingDefault[0],
      name: '', // 表单模板名称
      modelId: null, // 当前编辑的模板ID
      appearance: {
        theme: 'default',
        primaryColor: '#FF6B35',
        backgroundColor: '#FFFFFF',
        backgroundGradient: 'none',
        gradientDirection: 'to right',
        gradientColor1: '#FFFFFF',
        gradientColor2: '#F0F0F0',
        backgroundImage: '',
        fontSize: 'medium',
        headerImage: '',
        headerTitle: '活动报名'
      }
    }
  },
  created() {
    // 防止 firefox 下 拖拽 会新打卡一个选项卡
    document.body.ondrop = event => {
      event.preventDefault()
      event.stopPropagation()
    }
    
    // 获取路由参数中的 modelId
    const modelId = this.$route.params.modelId
    this.modelId = modelId === '-1' ? null : modelId
    if (this.modelId) {
      this.getModelInfo(this.modelId)
    }
  },
  watch: {
    'activeData.label': function (val, oldVal) {
      if (
        this.activeData.placeholder === undefined
        || !this.activeData.tag
        || oldActiveId !== this.activeId
      ) {
        return
      }
      this.activeData.placeholder = this.activeData.placeholder.replace(oldVal, '') + val
    },
    activeId: {
      handler(val) {
        oldActiveId = val
      },
      immediate: true
    }
  },
  computed: {
    // 当前页面的组件列表
    currentPageComponents() {
      const page = this.pages.find(p => p.id === this.currentPage)
      return page ? page.components : []
    },
    // 当前页面的字段列表，用于条件配置
    formFields() {
      return this.currentPageComponents.filter(item => item.layout === 'colFormItem' && item.tag !== 'el-button')
    },
    // 表单样式，根据配置动态生成
    formStyle() {
      if (this.formConf.backgroundGradient === 'none') {
        return { backgroundColor: this.formConf.backgroundColor }
      } else if (this.formConf.backgroundGradient === 'linear') {
        return {
          background: `linear-gradient(${this.formConf.gradientDirection}, ${this.formConf.gradientColor1}, ${this.formConf.gradientColor2})`
        }
      } else if (this.formConf.backgroundGradient === 'radial') {
        return {
          background: `radial-gradient(circle, ${this.formConf.gradientColor1}, ${this.formConf.gradientColor2})`
        }
      }
      return { backgroundColor: this.formConf.backgroundColor }
    }
  },
  mounted() {
    const clipboard = new ClipboardJS('#copyNode', {
      text: trigger => {
        const codeStr = this.generateCode()
        this.$notify({
          title: '成功',
          message: '代码已复制到剪切板，可粘贴。',
          type: 'success'
        })
        return codeStr
      }
    })
    clipboard.on('error', e => {
      this.$message.error('代码复制失败')
    })
  },
  methods: {
    getModelInfo(id){
      getModel(id).then(response => {
        const data = response.data
        // 设置模板名称
        if (data.name) {
          this.name = data.name
        }
        // 如果有表单内容，解析并加载
        if (data.content) {
          try {
            const formData = JSON.parse(data.content)
            if (formData.pages && Array.isArray(formData.pages)) {
              // 处理页面数据，确保每个页面都有id和components
              this.pages = formData.pages.map((page, index) => ({
                id: String(page.id || index + 1),
                name: page.name || `页面 ${index + 1}`,
                components: page.components || []
              }))
              // 设置当前页面为第一个页面
              if (this.pages.length > 0) {
                this.currentPage = this.pages[0].id
                // 如果第一个页面有组件，设置为活动项
                if (this.pages[0].components.length > 0) {
                  this.activeData = this.pages[0].components[0]
                  this.activeId = this.pages[0].components[0].formId
                }
              }
            } else if (formData.fields && Array.isArray(formData.fields)) {
              // 兼容旧格式，将fields转换为单页
              this.pages = [{
                id: '1',
                name: '页面 1',
                components: formData.fields
              }]
              this.currentPage = '1'
              if (formData.fields.length > 0) {
                this.activeData = formData.fields[0]
                this.activeId = formData.fields[0].formId
              }
            }
          } catch (e) {
            console.error('解析表单内容失败:', e)
            this.$message.error('加载表单数据失败')
          }
        }
      }).catch(error => {
        console.error('获取模板信息失败:', error)
        this.$message.error('获取模板信息失败')
      })
    },
    activeFormItem(element) {
      this.activeData = element
      this.activeId = element.formId
    },
    onEnd(obj, a) {
      if (obj.from !== obj.to) {
        this.activeData = tempActiveData
        this.activeId = this.idGlobal
      }
    },
    addComponent(item) {
      const clone = this.cloneComponent(item)
      this.currentPageComponents.push(clone)
      this.activeFormItem(clone)
    },
    cloneComponent(origin) {
      const clone = JSON.parse(JSON.stringify(origin))
      clone.formId = ++this.idGlobal
      clone.span = formConf.span
      clone.renderKey = +new Date() // 改变renderKey后可以实现强制更新组件
      if (!clone.layout) clone.layout = 'colFormItem'
      if (clone.layout === 'colFormItem') {
        clone.vModel = `field${this.idGlobal}`
        clone.placeholder !== undefined && (clone.placeholder += clone.label)
        tempActiveData = clone
      } else if (clone.layout === 'rowFormItem') {
        delete clone.label
        clone.componentName = `row${this.idGlobal}`
        clone.gutter = this.formConf.gutter
        tempActiveData = clone
      }
      return tempActiveData
    },
    AssembleFormData() {
      this.formData = {
        pages: JSON.parse(JSON.stringify(this.pages)),
        ...this.formConf
      }
    },
    generate(data) {
      const func = this[`exec${titleCase(this.operationType)}`]
      this.generateConf = data
      func && func(data)
    },
    execRun(data) {
      this.AssembleFormData()
      this.drawerVisible = true
    },
    execDownload(data) {
      const codeStr = this.generateCode()
      const blob = new Blob([codeStr], { type: 'text/plain;charset=utf-8' })
      this.$download.saveAs(blob, data.fileName)
    },
    execCopy(data) {
      document.getElementById('copyNode').click()
    },
    empty() {
      this.$confirm('确定要清空当前页面的所有组件吗？', '提示', { type: 'warning' }).then(
        () => {
          const page = this.pages.find(p => p.id === this.currentPage)
          if (page) {
            page.components = []
          }
        }
      )
    },
    drawingItemCopy(item, parent) {
      let clone = JSON.parse(JSON.stringify(item))
      clone = this.createIdAndKey(clone)
      parent.push(clone)
      this.activeFormItem(clone)
    },
    createIdAndKey(item) {
      item.formId = ++this.idGlobal
      item.renderKey = +new Date()
      if (item.layout === 'colFormItem') {
        item.vModel = `field${this.idGlobal}`
      } else if (item.layout === 'rowFormItem') {
        item.componentName = `row${this.idGlobal}`
      }
      if (Array.isArray(item.children)) {
        item.children = item.children.map(childItem => this.createIdAndKey(childItem))
      }
      return item
    },
    drawingItemDelete(index, parent) {
      parent.splice(index, 1)
      this.$nextTick(() => {
        const len = this.currentPageComponents.length
        if (len) {
          this.activeFormItem(this.currentPageComponents[len - 1])
        }
      })
    },
    generateCode() {
      const { type } = this.generateConf
      this.AssembleFormData()
      const script = vueScript(makeUpJs(this.formData, type))
      const html = vueTemplate(makeUpHtml(this.formData, type))
      const css = cssStyle(makeUpCss(this.formData))
      return beautifier.html(html + script + css, beautifierConf.html)
    },
    // 验证模板名称
    validateName() {
      if(!this.name || this.name.trim() === ''){
        this.$message.warning('表单模板名称不能为空');
        return false;
      }
      return true;
    },
    // 提交表单功能
    submitForm() {
      // 验证模板名称必填
      if(!this.name || this.name.trim() === ''){
        this.$message.error('表单模板名称为必填项，请输入模板名称');
        return;
      }
      
      this.AssembleFormData();
      console.log('提交的表单数据:', this.formData);
      
      // 检查是否所有页面都为空
      const hasComponents = this.pages.some(page => page.components && page.components.length > 0)
      if(!hasComponents){
        this.$message.error('表单不能为空，请添加组件后再提交');
        return;
      }
      var jsonStr = JSON.stringify(this.formData);
      //console.log(jsonStr)
      // 这里可以添加实际的提交逻辑
      // 例如发送到后端API
      var _data = {
        name: this.name.trim(),
        content: jsonStr
      }
      
      // 判断是新增还是修改
      let promise
      let successMsg
      if (this.modelId) {
        // 修改：需要包含 id
        _data.id = this.modelId
        promise = updateModel(_data)
        successMsg = "修改成功"
      } else {
        // 新增
        promise = addModel(_data)
        successMsg = "新增成功"
      }
      
      promise.then(response => {
        this.$modal.msgSuccess(successMsg)
        // 关闭当前页面标签并返回上一页
        setTimeout(() => {
          this.$tab.closePage()
        }, 1000)
      }).catch(error => {
        this.$modal.msgError((this.modelId ? "修改" : "新增") + "失败：" + (error.msg || error.message || '未知错误'))
      })
    },
    tagChange(newTag) {
      newTag = this.cloneComponent(newTag)
      newTag.vModel = this.activeData.vModel
      newTag.formId = this.activeId
      newTag.span = this.activeData.span
      delete this.activeData.tag
      delete this.activeData.tagIcon
      delete this.activeData.document
      Object.keys(newTag).forEach(key => {
        if (this.activeData[key] !== undefined
          && typeof this.activeData[key] === typeof newTag[key]) {
          newTag[key] = this.activeData[key]
        }
      })
      this.activeData = newTag
      this.updateDrawingList(newTag, this.currentPageComponents)
    },
    updateDrawingList(newTag, list) {
      const index = list.findIndex(item => item.formId === this.activeId)
      if (index > -1) {
        list.splice(index, 1, newTag)
      } else {
        list.forEach(item => {
          if (Array.isArray(item.children)) this.updateDrawingList(newTag, item.children)
        })
      }
    },
    // 添加新页面
    addPage() {
      const newPageId = String(this.pages.length + 1)
      const newPage = {
        id: newPageId,
        name: `页面 ${newPageId}`,
        components: []
      }
      this.pages.push(newPage)
      this.currentPage = newPageId
    },
    // 处理页面切换
    handlePageChange(tab) {
      // 使用 currentPage 获取当前选中的页面 ID
      const pageId = this.currentPage
      const page = this.pages.find(p => p.id === pageId)
      if (page) {
        if (page.components.length > 0) {
          this.activeFormItem(page.components[0])
        }
        // 注意：不在页面切换时自动创建默认组件
        // 只有第一个页面在初始化时会有默认组件
      }
    }
  }
}
</script>

<style lang='scss'>
.editor-tabs{
  background: #121315;
  .el-tabs__header{
    margin: 0;
    border-bottom-color: #121315;
    .el-tabs__nav{
      border-color: #121315;
    }
  }
  .el-tabs__item{
    height: 32px;
    line-height: 32px;
    color: #888a8e;
    border-left: 1px solid #121315 !important;
    background: #363636;
    margin-right: 5px;
    user-select: none;
  }
  .el-tabs__item.is-active{
    background: #1e1e1e;
    border-bottom-color: #1e1e1e!important;
    color: #fff;
  }
  .el-icon-edit{
    color: #f1fa8c;
  }
  .el-icon-document{
    color: #a95812;
  }
}

// home
.right-scrollbar {
  .el-scrollbar__view {
    padding: 12px 18px 15px 15px;
  }
}
.left-scrollbar .el-scrollbar__wrap {
  box-sizing: border-box;
  overflow-x: hidden !important;
  margin-bottom: 0 !important;
}
.center-tabs{
  .el-tabs__header{
    margin-bottom: 0!important;
  }
  .el-tabs__item{
    width: 50%;
    text-align: center;
  }
  .el-tabs__nav{
    width: 100%;
  }
}
.reg-item{
  padding: 12px 6px;
  background: #f8f8f8;
  position: relative;
  border-radius: 4px;
  .close-btn{
    position: absolute;
    right: -6px;
    top: -6px;
    display: block;
    width: 16px;
    height: 16px;
    line-height: 16px;
    background: rgba(0, 0, 0, 0.2);
    border-radius: 50%;
    color: #fff;
    text-align: center;
    z-index: 1;
    cursor: pointer;
    font-size: 12px;
    &:hover{
      background: rgba(210, 23, 23, 0.5)
    }
  }
  & + .reg-item{
    margin-top: 18px;
  }
}
.action-bar{
  & .el-button+.el-button {
    margin-left: 15px;
  }
  & i {
    font-size: 20px;
    vertical-align: middle;
    position: relative;
    top: -1px;
  }
}

.custom-tree-node{
  width: 100%;
  font-size: 14px;
  .node-operation{
    float: right;
  }
  i[class*="el-icon"] + i[class*="el-icon"]{
    margin-left: 6px;
  }
  .el-icon-plus{
    color: #409EFF;
  }
  .el-icon-delete{
    color: #157a0c;
  }
}

.left-scrollbar .el-scrollbar__view{
  overflow-x: hidden;
}

.el-rate{
  display: inline-block;
  vertical-align: text-top;
}
.el-upload__tip{
  line-height: 1.2;
}

$selectedColor: #f6f7ff;
$lighterBlue: #409EFF;

.container {
  position: relative;
  width: 100%;
  height: calc(100vh - 84px);
}

.components-list {
  padding: 8px;
  box-sizing: border-box;
  height: calc(100vh - 125px);
  .components-item {
    display: inline-block;
    width: 48%;
    margin: 1%;
    transition: transform 0ms !important;
  }
}
.components-draggable{
  padding-bottom: 20px;
}
.components-title{
  font-size: 14px;
  color: #222;
  margin: 6px 2px;
  .svg-icon{
    color: #666;
    font-size: 18px;
  }
}

.components-body {
  padding: 8px 10px;
  background: $selectedColor;
  font-size: 12px;
  cursor: move;
  border: 1px dashed $selectedColor;
  border-radius: 3px;
  .svg-icon{
    color: #777;
    font-size: 15px;
  }
  &:hover {
    border: 1px dashed #787be8;
    color: #787be8;
    .svg-icon {
      color: #787be8;
    }
  }
}

.left-board {
  width: 260px;
  position: absolute;
  left: 0;
  top: 0;
  height: 100vh;
}
.left-scrollbar{
  height: calc(100vh - 50px);
  overflow: hidden;
}
.center-scrollbar {
  height: 100%;
  overflow: auto;
  border-left: 1px solid #f1e8e8;
  border-right: 1px solid #f1e8e8;
  box-sizing: border-box;
}
.center-board {
  height: 100vh;
  width: auto;
  margin: 0 350px 0 260px;
  box-sizing: border-box;
}
.page-tabs {
  height: calc(100vh - 50px);
  overflow: hidden;
  .el-tabs {
    height: 100%;
  }
  .el-tabs__content {
    height: calc(100% - 39px);
    overflow: hidden;
  }
  .page-tab-content {
    height: 100%;
    overflow: hidden;
  }
}
.empty-info{
  position: absolute;
  top: 46%;
  left: 0;
  right: 0;
  text-align: center;
  font-size: 18px;
  color: #ccb1ea;
  letter-spacing: 4px;
}
.action-bar{
  position: relative;
  height: 50px;
  padding: 0 15px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  box-sizing: border-box;
  border: 1px solid #f1e8e8;
  border-top: none;
  border-left: none;
  .left-side{
    display: flex;
    align-items: center;
    .form-label{
      margin-right: 10px;
      font-size: 14px;
      color: #606266;
      .required-mark{
        color: #F56C6C;
        margin-right: 2px;
      }
    }
  }
  .right-side{
    display: flex;
    align-items: center;
  }
  .delete-btn{
    color: #F56C6C;
  }
  .add-page-btn{
    margin-left: 15px;
  }
  .submit-btn{
    margin-left: 15px;
  }
}
.logo-wrapper{
  position: relative;
  height: 50px;
  background: #fff;
  border-bottom: 1px solid #f1e8e8;
  box-sizing: border-box;
}
.logo{
  position: absolute;
  left: 12px;
  top: 6px;
  line-height: 30px;
  color: #00afff;
  font-weight: 600;
  font-size: 17px;
  white-space: nowrap;
  > img{
    width: 30px;
    height: 30px;
    vertical-align: top;
  }
  .github{
    display: inline-block;
    vertical-align: sub;
    margin-left: 15px;
    > img{
      height: 22px;
    }
  }
}

.center-board-row {
  padding: 12px 12px 15px 12px;
  box-sizing: border-box;
  & > .el-form {
    // 77 = 12+15+50
    height: calc(100vh - 77px);
  }
}
.drawing-board {
  height: calc(100vh - 195px);
  position: relative;
  overflow-y: scroll;
  padding-top: 10px;
  .components-body {
    padding: 0;
    margin: 0;
    font-size: 0;
  }
  .el-form-item:last-child {
    padding-bottom: 80px;
  }
  .sortable-ghost {
    position: relative;
    display: block;
    overflow: hidden;
    &::before {
      content: " ";
      position: absolute;
      left: 0;
      right: 0;
      top: 0;
      height: 3px;
      background: rgb(89, 89, 223);
      z-index: 2;
    }
  }
  .components-item.sortable-ghost {
    width: 100%;
    height: 60px;
    background-color: $selectedColor;
  }
  .active-from-item {
    & > .el-form-item{
      background: $selectedColor;
      border-radius: 6px;
    }
    & > .drawing-item-copy, & > .drawing-item-delete{
      display: initial;
    }
    & > .component-name{
      color: $lighterBlue;
    }
  }
  .el-form-item{
    margin-bottom: 15px;
  }
}
.drawing-item{
  position: relative;
  cursor: move;
  &.unfocus-bordered:not(.activeFromItem) > div:first-child  {
    border: 1px dashed #ccc;
  }
  .el-form-item{
    padding: 12px 10px;
  }
}
.drawing-row-item{
  position: relative;
  cursor: move;
  box-sizing: border-box;
  border: 1px dashed #ccc;
  border-radius: 3px;
  padding: 0 2px;
  margin-bottom: 15px;
  .drawing-row-item {
    margin-bottom: 2px;
  }
  .el-col{
    margin-top: 22px;
  }
  .el-form-item{
    margin-bottom: 0;
  }
  .drag-wrapper{
    min-height: 80px;
  }
  &.active-from-item{
    border: 1px dashed $lighterBlue;
  }
  .component-name{
    position: absolute;
    top: 0;
    left: 0;
    font-size: 12px;
    color: #bbb;
    display: inline-block;
    padding: 0 6px;
  }
}
.drawing-item, .drawing-row-item{
  &:hover {
    & > .el-form-item{
      background: $selectedColor;
      border-radius: 6px;
    }
    & > .drawing-item-copy, & > .drawing-item-delete{
      display: initial;
    }
  }
  & > .drawing-item-copy, & > .drawing-item-delete{
    display: none;
    position: absolute;
    top: -10px;
    width: 22px;
    height: 22px;
    line-height: 22px;
    text-align: center;
    border-radius: 50%;
    font-size: 12px;
    border: 1px solid;
    cursor: pointer;
    z-index: 1;
  }
  & > .drawing-item-copy{
    right: 56px;
    border-color: $lighterBlue;
    color: $lighterBlue;
    background: #fff;
    &:hover{
      background: $lighterBlue;
      color: #fff;
    }
  }
  & > .drawing-item-delete{
    right: 24px;
    border-color: #F56C6C;
    color: #F56C6C;
    background: #fff;
    &:hover{
      background: #F56C6C;
      color: #fff;
    }
  }
}
</style>