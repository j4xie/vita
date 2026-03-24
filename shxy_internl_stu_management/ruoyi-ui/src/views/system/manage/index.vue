<template>
  <div class="app-container">
    <el-form :model="queryParams" ref="queryForm" size="small" :inline="true" v-show="showSearch" label-width="68px">
      <el-form-item label="流程名称" prop="name">
        <el-input v-model="queryParams.name" placeholder="请输入流程名称" clearable style="width: 240px" @keyup.enter.native="handleQuery" />
      </el-form-item>
      <el-form-item label="适用类型" prop="type">
        <el-select v-model="queryParams.type" placeholder="请选择适用类型" clearable style="width: 240px">
          <el-option label="费用报销" value="expense" />
          <el-option label="请假申请" value="leave" />
          <el-option label="采购申请" value="purchase" />
          <el-option label="出差申请" value="business" />
        </el-select>
      </el-form-item>
      <el-form-item label="状态" prop="active">
        <el-select v-model="queryParams.active" placeholder="请选择状态" clearable style="width: 240px">
          <el-option label="启用" :value="true" />
          <el-option label="停用" :value="false" />
        </el-select>
      </el-form-item>
      <el-form-item label="创建时间">
        <el-date-picker v-model="dateRange" style="width: 240px" value-format="yyyy-MM-dd" type="daterange" range-separator="-" start-placeholder="开始日期" end-placeholder="结束日期"></el-date-picker>
      </el-form-item>
      <el-form-item>
        <el-button type="primary" icon="el-icon-search" size="mini" @click="handleQuery">搜索</el-button>
        <el-button icon="el-icon-refresh" size="mini" @click="resetQuery">重置</el-button>
      </el-form-item>
    </el-form>

    <el-row :gutter="10" class="mb8">
      <el-col :span="1.5">
        <el-button
          type="primary"
          plain
          icon="el-icon-plus"
          size="mini"
          @click="handleAdd"
          v-hasPermi="['system:manage:add']"
        >新增</el-button>
      </el-col>
      <el-col :span="1.5">
        <el-button
          type="success"
          plain
          icon="el-icon-edit"
          size="mini"
          :disabled="single"
          @click="handleUpdate"
          v-hasPermi="['system:manage:edit']"
        >修改</el-button>
      </el-col>
      <el-col :span="1.5">
        <el-button
          type="danger"
          plain
          icon="el-icon-delete"
          size="mini"
          :disabled="multiple"
          @click="handleDelete"
          v-hasPermi="['system:manage:remove']"
        >删除</el-button>
      </el-col>
      <el-col :span="1.5">
        <el-button
          type="warning"
          plain
          icon="el-icon-download"
          size="mini"
          @click="handleExport"
          v-hasPermi="['system:manage:export']"
        >导出</el-button>
      </el-col>
      <right-toolbar :showSearch.sync="showSearch" @queryTable="getList" :columns="columns"></right-toolbar>
    </el-row>

    <el-table v-loading="loading" :data="manageList" @selection-change="handleSelectionChange">
      <el-table-column type="selection" width="55" align="center" />
      <el-table-column label="流程编号" align="center" prop="id" v-if="columns.id.visible" />
      <el-table-column label="流程名称" align="center" prop="name" v-if="columns.name.visible" :show-overflow-tooltip="true" />
      <el-table-column label="适用类型" align="center" prop="type" v-if="columns.type.visible">
        <template slot-scope="scope">
          <span>{{ getProcessTypeLabel(scope.row.type) }}</span>
        </template>
      </el-table-column>
      <el-table-column label="描述" align="center" prop="description" v-if="columns.description.visible" :show-overflow-tooltip="true" />
      <el-table-column label="状态" align="center" prop="active" v-if="columns.active.visible">
        <template slot-scope="scope">
          <el-switch
            v-model="scope.row.active"
            @change="toggleProcess(scope.row.id, scope.row.active)"
            active-text="启用"
            inactive-text="停用"
          />
        </template>
      </el-table-column>
      <el-table-column label="创建时间" align="center" prop="createTime" v-if="columns.createTime.visible" width="180">
        <template slot-scope="scope">
          <span>{{ parseTime(scope.row.createTime) }}</span>
        </template>
      </el-table-column>
      <el-table-column label="操作" align="center" class-name="small-padding fixed-width" width="180">
        <template slot-scope="scope">
          <el-button
            size="mini"
            type="text"
            icon="el-icon-edit"
            @click="handleUpdate(scope.row)"
            v-hasPermi="['system:manage:edit']"
          >修改</el-button>
          <el-button
            size="mini"
            type="text"
            icon="el-icon-delete"
            @click="handleDelete(scope.row)"
            v-hasPermi="['system:manage:remove']"
          >删除</el-button>
        </template>
      </el-table-column>
    </el-table>

    <pagination
      v-show="total>0"
      :total="total"
      :page.sync="queryParams.pageNum"
      :limit.sync="queryParams.pageSize"
      @pagination="getList"
    />

    <!-- 添加或修改流程管理对话框 -->
    <el-dialog :title="title" :visible.sync="open" width="1200px" append-to-body class="process-design-dialog" :close-on-click-modal="false">
      <!-- 标签页导航 -->
      <el-tabs v-model="activeTab" type="card" class="process-tabs">
        <!-- 基础设置 -->
        <el-tab-pane label="基础设置" name="basic">
          <div class="wflow-basic-setting">
            <div class="setting-section">
              <div class="section-title">表单名称</div>
              <el-input v-model="form.name" placeholder="请输入流程名称" style="width: 300px" />
            </div>
            
            <div class="setting-section">
              <div class="section-title">所在分组</div>
              <div class="group-setting">
                <el-select v-model="form.group" placeholder="请选择分组" style="width: 300px">
                  <el-option label="人事" value="1" />
                  <el-option label="财务" value="2" />
                  <el-option label="行政" value="3" />
                  <el-option label="其他" value="4" />
                </el-select>
                <el-button type="primary" size="small" style="margin-left: 10px" @click="addGroup">新增分组</el-button>
              </div>
            </div>
            
            <div class="setting-section">
              <div class="section-title">表单说明</div>
              <el-input v-model="form.description" type="textarea" placeholder="请输入描述" style="width: 500px" :maxlength="500" show-word-limit />
            </div>
            
            <div class="setting-section">
              <div class="section-title">消息通知方式</div>
              <el-select v-model="form.settings.notify.type" placeholder="请选择通知方式" style="width: 300px">
                <el-option label="应用通知" value="APP" />
                <el-option label="邮件" value="EMAIL" />
                <el-option label="短信" value="SMS" />
                <el-option label="微信" value="WX" />
              </el-select>
            </div>
            
            <div class="setting-section">
              <div class="section-title">消息通知标题</div>
              <el-input v-model="form.settings.notify.title" placeholder="请输入通知标题" style="width: 300px" />
            </div>
            
            <div class="setting-section">
              <div class="section-title">谁可以发起提交</div>
              <el-select v-model="form.settings.commiter" multiple placeholder="请选择" style="width: 300px">
                <el-option label="部门" value="department" />
                <el-option label="角色" value="role" />
                <el-option label="用户" value="user" />
              </el-select>
            </div>
            
            <div class="setting-section">
              <div class="section-title">谁可以编辑此流程</div>
              <el-select v-model="form.settings.admin" multiple placeholder="请选择" style="width: 300px">
                <el-option label="部门" value="department" />
                <el-option label="角色" value="role" />
                <el-option label="用户" value="user" />
              </el-select>
            </div>
          </div>
        </el-tab-pane>
        
        <!-- 表单设计 -->
        <el-tab-pane label="审批表单" name="form">
          <div class="wflow-form-designer">
            <!-- 左侧组件库 -->
            <div class="component-library">
              <div class="library-header">
                <div class="library-title">基础组件</div>
                <div class="library-subtitle">点击添加到表单</div>
              </div>
              <div class="components">
                <div 
                  v-for="component in formComponents" 
                  :key="component.id"
                  class="component-item"
                  :draggable="true"
                  @click="addFormComponent(component.id, component.label)"
                  @dragstart="handleDragStart($event, component)"
                >
                  <div class="component-icon" :style="{ backgroundColor: component.color }">
                    <i :class="component.icon" style="color: white"></i>
                  </div>
                  <div class="component-label">{{ component.label }}</div>
                </div>
              </div>
            </div>
            
            <!-- 表单设计区域 -->
            <div 
              class="form-design-area"
              :class="{ 'drag-over': isDragOver }"
            >
              <div class="design-header">
                <div class="header-left">
                  <h4>审批表单</h4>
                  <span class="form-count">{{ form.formItems.length }} 个组件</span>
                </div>
                <div class="design-actions">
                  <el-button size="small" icon="el-icon-view">预览</el-button>
                  <el-button size="small" icon="el-icon-document">保存</el-button>
                </div>
              </div>
              <div 
                class="form-preview"
                @dragover="handleDragOver($event)"
                @drop="handleDrop($event)"
                @dragleave="handleDragLeave($event)"
              >
                <div v-if="form.formItems.length === 0" class="empty-form">
                  <div class="empty-icon">
                    <i class="el-icon-plus"></i>
                  </div>
                  <p>从左侧拖拽或点击组件添加到此处开始设计表单</p>
                </div>
                <div v-else class="form-content">
                  <div 
                    v-for="(item, index) in form.formItems" 
                    :key="item.id"
                    class="form-item"
                    :class="{ 'selected': selectedFormItem && selectedFormItem.id === item.id }"
                    @click="selectFormItem(item)"
                  >
                    <div class="item-header">
                      <div class="item-left">
                        <div class="item-icon" :style="{ backgroundColor: item.color }">
                          <i :class="item.icon" style="color: white"></i>
                        </div>
                        <span class="item-label">{{ item.label }}</span>
                        <el-tag v-if="item.required" type="danger" size="mini">必填</el-tag>
                      </div>
                      <div class="item-actions">
                        <el-button type="text" size="small" icon="el-icon-edit" @click.stop="editFormComponent(item)">编辑</el-button>
                        <el-button type="text" size="small" icon="el-icon-delete" @click.stop="deleteFormComponent(index)">删除</el-button>
                      </div>
                    </div>
                    <div class="item-preview">
                      <el-input v-if="item.type === 'text'" :placeholder="item.placeholder" disabled />
                      <el-input v-else-if="item.type === 'textarea'" type="textarea" :placeholder="item.placeholder" disabled />
                      <el-input-number v-else-if="item.type === 'number'" :placeholder="item.placeholder" disabled style="width: 100%" />
                      <el-input v-else-if="item.type === 'money'" :placeholder="item.placeholder" disabled>
                        <template slot="prepend">¥</template>
                      </el-input>
                      <el-select v-else-if="item.type === 'select'" :placeholder="item.placeholder" disabled style="width: 100%" />
                      <el-date-picker v-else-if="item.type === 'datetime'" type="datetime" :placeholder="item.placeholder" disabled style="width: 100%" />
                      <div v-else-if="item.type === 'daterange'" class="daterange-preview">
                        <div class="daterange-item">
                          <span class="daterange-label">开始时间</span>
                          <div class="daterange-input">
                            <i class="el-icon-date"></i>
                            <span>{{ item.format === 'yyyy-MM-dd' ? '请选择开始日期' : '请选择开始时间' }}</span>
                          </div>
                        </div>
                        <div class="daterange-separator">
                          <i class="el-icon-right"></i>
                        </div>
                        <div class="daterange-item">
                          <span class="daterange-label">结束时间</span>
                          <div class="daterange-input">
                            <i class="el-icon-date"></i>
                            <span>{{ item.format === 'yyyy-MM-dd' ? '请选择结束日期' : '请选择结束时间' }}</span>
                          </div>
                        </div>
                      </div>
                      <el-radio-group v-else-if="item.type === 'radio'" disabled>
                        <el-radio label="选项1">选项1</el-radio>
                        <el-radio label="选项2">选项2</el-radio>
                      </el-radio-group>
                      <el-checkbox-group v-else-if="item.type === 'checkbox'" disabled>
                        <el-checkbox label="选项1">选项1</el-checkbox>
                        <el-checkbox label="选项2">选项2</el-checkbox>
                      </el-checkbox-group>
                      <el-upload v-else-if="item.type === 'upload'" disabled action="#" style="width: 100%">
                        <el-button size="small" type="primary">点击上传</el-button>
                      </el-upload>
                      <el-select v-else-if="item.type === 'user'" :placeholder="item.placeholder" disabled style="width: 100%">
                        <el-option label="人员1" value="1" />
                        <el-option label="人员2" value="2" />
                      </el-select>
                      <el-select v-else-if="item.type === 'department'" :placeholder="item.placeholder" disabled style="width: 100%">
                        <el-option label="部门1" value="1" />
                        <el-option label="部门2" value="2" />
                      </el-select>
                      <div v-else-if="item.type === 'description'" class="description-preview" v-html="item.description || '说明文字内容'">
                      </div>
                      <el-input v-else :placeholder="item.placeholder" disabled />
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
            <!-- 右侧属性面板 -->
            <div v-if="selectedFormItem" class="form-property-panel">
              <div class="panel-header">
                <h3>属性配置</h3>
                <el-button type="text" size="small" icon="el-icon-close" @click="selectedFormItem = null"></el-button>
              </div>
              <div class="panel-content">
                <el-form label-width="100px">
                  <el-form-item label="组件名称">
                    <el-input v-model="selectedFormItem.label"></el-input>
                  </el-form-item>
                  <el-form-item label="字段名称">
                    <el-input v-model="selectedFormItem.field"></el-input>
                  </el-form-item>
                  <el-form-item label="是否必填">
                    <el-switch v-model="selectedFormItem.required"></el-switch>
                  </el-form-item>
                  <el-form-item v-if="selectedFormItem.type !== 'description'" label="提示信息">
                    <el-input v-model="selectedFormItem.placeholder" type="textarea"></el-input>
                  </el-form-item>
                  
                  <!-- 金额输入配置 -->
                  <el-form-item v-if="selectedFormItem.type === 'money'" label="金额精度">
                    <el-select v-model="selectedFormItem.precision" placeholder="请选择精度">
                      <el-option label="整数" :value="0" />
                      <el-option label="一位小数" :value="1" />
                      <el-option label="两位小数" :value="2" />
                    </el-select>
                  </el-form-item>
                  
                  <!-- 日期时间配置 -->
                  <el-form-item v-if="selectedFormItem.type === 'datetime'" label="日期格式">
                    <el-select v-model="selectedFormItem.format" placeholder="请选择日期格式">
                      <el-option label="年-月-日" value="yyyy-MM-dd" />
                      <el-option label="年-月-日 时:分" value="yyyy-MM-dd HH:mm" />
                      <el-option label="年-月-日 时:分:秒" value="yyyy-MM-dd HH:mm:ss" />
                    </el-select>
                  </el-form-item>
                  
                  <!-- 日期区间配置 -->
                  <el-form-item v-if="selectedFormItem.type === 'daterange'" label="日期格式">
                    <el-select v-model="selectedFormItem.format" placeholder="请选择日期格式">
                      <el-option label="年-月-日" value="yyyy-MM-dd" />
                      <el-option label="年-月-日 时:分" value="yyyy-MM-dd HH:mm" />
                      <el-option label="年-月-日 时:分:秒" value="yyyy-MM-dd HH:mm:ss" />
                    </el-select>
                  </el-form-item>
                  <el-form-item v-if="selectedFormItem.type === 'daterange'" label="默认值">
                    <el-select v-model="selectedFormItem.defaultValue" placeholder="请选择默认值">
                      <el-option label="无" value="none" />
                      <el-option label="今天" value="today" />
                      <el-option label="本周" value="week" />
                      <el-option label="本月" value="month" />
                    </el-select>
                  </el-form-item>
                  
                  <!-- 说明文字配置 -->
                  <el-form-item v-if="selectedFormItem.type === 'description'" label="说明内容">
                    <el-input v-model="selectedFormItem.description" type="textarea" :rows="4" placeholder="请输入说明文字内容"></el-input>
                  </el-form-item>
                  <el-form-item v-if="selectedFormItem.type === 'description'" label="文字样式">
                    <el-select v-model="selectedFormItem.style" placeholder="请选择样式">
                      <el-option label="普通" value="normal" />
                      <el-option label="提示" value="info" />
                      <el-option label="警告" value="warning" />
                      <el-option label="成功" value="success" />
                      <el-option label="危险" value="danger" />
                    </el-select>
                  </el-form-item>
                  
                  <!-- 选项配置 -->
                  <el-form-item v-if="['select', 'radio', 'checkbox'].includes(selectedFormItem.type)" label="选项设置">
                    <div class="options-setting">
                      <div v-for="(option, idx) in selectedFormItem.options" :key="idx" class="option-item">
                        <el-input v-model="option.label" placeholder="选项名称" size="small" />
                        <el-button type="text" size="small" icon="el-icon-delete" @click="removeOption(idx)"></el-button>
                      </div>
                      <el-button type="text" size="small" icon="el-icon-plus" @click="addOption">添加选项</el-button>
                    </div>
                  </el-form-item>
                </el-form>
                <div class="panel-actions">
                  <el-button type="primary" @click="updateFormComponent">更新组件</el-button>
                  <el-button @click="selectedFormItem = null">取消</el-button>
                </div>
              </div>
            </div>
          </div>
        </el-tab-pane>
        
        <!-- 流程设计 -->
        <el-tab-pane label="审批流程" name="process">
          <div class="approval-flow-wrapper">
            <!-- 流程画布 -->
            <div class="approval-flow-canvas">
              <div class="approval-flow-container">
                <!-- 发起人节点 -->
                <div class="flow-node start-node" @click="selectNode('start')">
                  <div class="node-header">
                    <i class="el-icon-user"></i>
                    <span>发起人</span>
                  </div>
                  <div class="node-content">
                    <span class="node-text">所有人</span>
                    <i class="el-icon-arrow-right"></i>
                  </div>
                </div>
                
                <!-- 发起人节点后的连接线和添加按钮 - 始终显示 -->
                <div class="flow-line" v-if="!hasConditionBranch && !hasParallelBranch">
                  <div class="add-btn" @click="showAddNodeMenu($event, 'afterStart')">
                    <i class="el-icon-plus"></i>
                  </div>
                </div>
                
                <!-- 发起人节点到条件分支/并行分支的连线 -->
                <div class="flow-line" v-if="hasConditionBranch || hasParallelBranch">
                  <div class="add-btn" @click="showAddNodeMenu($event, 'afterStart')">
                    <i class="el-icon-plus"></i>
                  </div>
                </div>
                
                <!-- 流程节点列表 -->
                <div v-for="(node, index) in flowNodes" :key="node.id" class="flow-node-wrapper">
                  <!-- 普通节点 -->
                  <div v-if="node.type !== 'conditionBranch' && node.type !== 'parallelBranch'" :class="['flow-node', node.type + '-node']" @click="selectNode(node)">
                    <div class="node-header">
                      <i :class="getNodeIcon(node.type)"></i>
                      <span>{{ getNodeTitle(node) }}</span>
                      <!-- 删除按钮 - 鼠标悬停显示 -->
                      <span class="node-delete-btn" @click.stop="deleteNode(node)">
                        <i class="el-icon-close"></i>
                      </span>
                    </div>
                    <div class="node-content">
                      <span class="node-text">{{ node.content || getDefaultNodeContent(node.type) }}</span>
                      <i class="el-icon-arrow-right"></i>
                    </div>
                  </div>
                  
                  <!-- 条件分支节点 -->
                  <div v-if="node.type === 'conditionBranch'" class="condition-branch-container" :style="{ '--branch-width': (node.conditions.length <= 2 ? 280 : (280 + (node.conditions.length - 2) * 280)) + 'px' }">
                    <div class="branch-header">
                      <div class="add-condition-btn" @click="addCondition(index)">添加条件</div>
                    </div>
                    <div class="branch-content">
                      <div class="branch-nodes">
                        <div v-for="(condition, conditionIndex) in node.conditions" :key="condition.id" class="branch-node-wrapper">
                          <div class="branch-node condition-node" @click="selectNode(condition)">
                            <div class="branch-node-header">
                              <span class="branch-node-name">{{ condition.name }}</span>
                              <span class="branch-node-priority">优先级{{ condition.priority }}</span>
                              <!-- 删除按钮 - 鼠标悬停显示 -->
                              <span class="branch-delete-btn" @click.stop="deleteCondition(index, conditionIndex)">
                                <i class="el-icon-close"></i>
                              </span>
                            </div>
                            <div class="branch-node-content">{{ condition.condition || '请设置条件' }}</div>
                          </div>
                          <!-- 条件分支内的子节点 -->
                          <div v-for="(subNode, subIndex) in condition.nodes" :key="subNode.id" class="condition-sub-node-wrapper">
                            <div class="flow-line">
                              <div class="add-btn" @click="showAddNodeMenu($event, 'afterConditionSubNode', conditionIndex, index, subIndex)">
                                <i class="el-icon-plus"></i>
                              </div>
                            </div>
                            <div :class="['flow-node', subNode.type + '-node']" @click="selectNode(subNode)">
                              <div class="node-header">
                                <i :class="getNodeIcon(subNode.type)"></i>
                                <span>{{ getNodeTitle(subNode) }}</span>
                                <span class="node-delete-btn" @click.stop="deleteSubNode(condition, subIndex)">
                                  <i class="el-icon-close"></i>
                                </span>
                              </div>
                              <div class="node-content">
                                <span class="node-text">{{ subNode.content || getDefaultNodeContent(subNode.type) }}</span>
                                <i class="el-icon-arrow-right"></i>
                              </div>
                            </div>
                          </div>
                          <div class="branch-line-vertical">
                            <div class="add-btn" @click="addCondition(index, conditionIndex)">
                              <i class="el-icon-plus"></i>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                    <div class="branch-footer">
                    </div>
                  </div>
                  
                  <!-- 并行分支节点 -->
                  <div v-if="node.type === 'parallelBranch'" class="parallel-branch-container" :style="{ '--branch-width': (node.branches.length <= 2 ? 280 : (280 + (node.branches.length - 2) * 280)) + 'px' }">
                    <div class="branch-header">
                      <div class="add-branch-btn" @click="addBranchToParallel(index)">添加分支</div>
                    </div>
                    <div class="branch-content">
                      <div class="branch-nodes">
                        <div v-for="(branch, branchIndex) in node.branches" :key="branch.id" class="branch-node-wrapper">
                          <div class="branch-node parallel-node" @click="selectNode(branch)">
                            <div class="branch-node-header">
                              <i class="el-icon-s-unfold"></i>
                              <span class="branch-node-name">{{ branch.name }}</span>
                              <!-- 删除按钮 - 鼠标悬停显示 -->
                              <span class="branch-delete-btn" @click.stop="deleteParallelBranch(index, branchIndex)">
                                <i class="el-icon-close"></i>
                              </span>
                            </div>
                            <div class="branch-node-content">{{ branch.content || '并行任务（同时进行）' }}</div>
                          </div>
                          <!-- 并行分支内的子节点 -->
                          <div v-for="(subNode, subIndex) in branch.nodes" :key="subNode.id" class="condition-sub-node-wrapper">
                            <div class="flow-line">
                              <div class="add-btn" @click="showAddNodeMenu($event, 'afterParallelSubNode', index, branchIndex, subIndex)">
                                <i class="el-icon-plus"></i>
                              </div>
                            </div>
                            <div :class="['flow-node', subNode.type + '-node']" @click="selectNode(subNode)">
                              <div class="node-header">
                                <i :class="getNodeIcon(subNode.type)"></i>
                                <span>{{ getNodeTitle(subNode) }}</span>
                                <span class="node-delete-btn" @click.stop="deleteSubNode(branch, subIndex)">
                                  <i class="el-icon-close"></i>
                                </span>
                              </div>
                              <div class="node-content">
                                <span class="node-text">{{ subNode.content || getDefaultNodeContent(subNode.type) }}</span>
                                <i class="el-icon-arrow-right"></i>
                              </div>
                            </div>
                          </div>
                          <div class="branch-line-vertical">
                            <div class="add-btn" @click="showAddNodeMenu($event, 'afterParallel', index, branchIndex)">
                              <i class="el-icon-plus"></i>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                    <div class="branch-footer">
                    </div>
                  </div>
                  
                  <!-- 连接线和添加按钮 - 每个节点后面都有 -->
                  <div class="flow-line">
                    <div class="add-btn" @click="showAddNodeMenu($event, 'afterNode', index)">
                      <i class="el-icon-plus"></i>
                    </div>
                  </div>
                </div>
                
                <!-- 流程结束节点 -->
                <div class="flow-node end-node" @click="selectNode('end')">
                  <div class="node-content">
                    <span>流程结束</span>
                  </div>
                </div>
              </div>
            </div>
            
            <!-- 右侧属性面板 -->
            <div v-if="selectedNode" class="node-property-panel">
              <div class="panel-header">
                <h3>{{ getNodeTitle(selectedNode) }}</h3>
                <el-button type="text" size="small" icon="el-icon-close" @click="selectedNode = null"></el-button>
              </div>
              <div class="panel-content">
                <!-- 发起人节点配置 -->
                <template v-if="selectedNode === 'start'">
                  <el-form label-width="80px">
                    <el-form-item label="发起人">
                      <el-select v-model="startNodeConfig.initiator" placeholder="请选择发起人">
                        <el-option label="所有人" value="all"></el-option>
                        <el-option label="指定人员" value="specified"></el-option>
                        <el-option label="指定部门" value="department"></el-option>
                      </el-select>
                    </el-form-item>
                  </el-form>
                </template>
                
                <!-- 审批人节点配置 -->
                <template v-if="selectedNode.type === 'approver'">
                  <el-form label-width="80px">
                    <el-form-item label="审批人">
                      <el-select v-model="selectedNode.config.approver" placeholder="请选择审批人">
                        <el-option label="指定人员" value="specified"></el-option>
                        <el-option label="发起人自选" value="selfSelect"></el-option>
                        <el-option label="连续多级主管" value="multiLevel"></el-option>
                        <el-option label="主管" value="manager"></el-option>
                        <el-option label="角色" value="role"></el-option>
                        <el-option label="发起人自己" value="initiator"></el-option>
                      </el-select>
                    </el-form-item>
                    <el-form-item label="审批方式">
                      <el-radio-group v-model="selectedNode.config.mode">
                        <el-radio label="or">或签（一人通过即可）</el-radio>
                        <el-radio label="and">会签（需所有人通过）</el-radio>
                      </el-radio-group>
                    </el-form-item>
                    <el-form-item label="审批为空">
                      <el-select v-model="selectedNode.config.emptyAction">
                        <el-option label="自动通过" value="pass"></el-option>
                        <el-option label="自动驳回" value="reject"></el-option>
                        <el-option label="转交管理员" value="transfer"></el-option>
                      </el-select>
                    </el-form-item>
                  </el-form>
                </template>
                
                <!-- 抄送人节点配置 -->
                <template v-if="selectedNode.type === 'cc'">
                  <el-form label-width="80px">
                    <el-form-item label="抄送人">
                      <el-select v-model="selectedNode.config.cc" placeholder="请设置抄送人">
                        <el-option label="指定人员" value="specified"></el-option>
                        <el-option label="发起人自选" value="selfSelect"></el-option>
                        <el-option label="主管" value="manager"></el-option>
                        <el-option label="角色" value="role"></el-option>
                      </el-select>
                    </el-form-item>
                  </el-form>
                </template>
                
                <!-- 条件节点配置 -->
                <template v-if="selectedNode.type === 'condition'">
                  <el-form label-width="80px">
                    <el-form-item label="条件名称">
                      <el-input v-model="selectedNode.name" placeholder="请输入条件名称"></el-input>
                    </el-form-item>
                    <el-form-item label="条件表达式">
                      <el-input v-model="selectedNode.condition" type="textarea" :rows="3" placeholder="请输入条件表达式"></el-input>
                    </el-form-item>
                    <el-form-item label="优先级">
                      <el-input v-model.number="selectedNode.priority" type="number" placeholder="请输入优先级"></el-input>
                    </el-form-item>
                  </el-form>
                </template>
                
                <!-- 并行分支配置 -->
                <template v-if="selectedNode.type === 'parallel'">
                  <el-form label-width="80px">
                    <el-form-item label="分支名称">
                      <el-input v-model="selectedNode.name" placeholder="请输入分支名称"></el-input>
                    </el-form-item>
                    <el-form-item label="分支内容">
                      <el-input v-model="selectedNode.content" placeholder="请输入分支内容"></el-input>
                    </el-form-item>
                  </el-form>
                </template>
                
                <!-- 延迟等待配置 -->
                <template v-if="selectedNode.type === 'delay'">
                  <el-form label-width="80px">
                    <el-form-item label="延迟时间">
                      <el-input v-model.number="selectedNode.config.time" type="number" placeholder="请输入延迟时间"></el-input>
                    </el-form-item>
                    <el-form-item label="时间单位">
                      <el-select v-model="selectedNode.config.unit">
                        <el-option label="秒" value="second"></el-option>
                        <el-option label="分钟" value="minute"></el-option>
                        <el-option label="小时" value="hour"></el-option>
                        <el-option label="天" value="day"></el-option>
                      </el-select>
                    </el-form-item>
                  </el-form>
                </template>
                
                <!-- 触发器配置 -->
                <template v-if="selectedNode.type === 'trigger'">
                  <el-form label-width="80px">
                    <el-form-item label="触发类型">
                      <el-select v-model="selectedNode.config.type" placeholder="请选择触发类型">
                        <el-option label="webhook" value="webhook"></el-option>
                        <el-option label="API调用" value="api"></el-option>
                        <el-option label="邮件通知" value="email"></el-option>
                      </el-select>
                    </el-form-item>
                    <el-form-item label="触发地址">
                      <el-input v-model="selectedNode.config.url" placeholder="请输入触发地址"></el-input>
                    </el-form-item>
                  </el-form>
                </template>
                
                <div class="panel-actions">
                  <el-button type="primary" @click="saveNodeConfig">保存</el-button>
                  <el-button v-if="selectedNode.type && selectedNode.type !== 'start' && selectedNode.type !== 'end'" type="danger" @click="deleteNode(selectedNode)">删除</el-button>
                </div>
              </div>
            </div>
          </div>
          
          <!-- 添加节点菜单 -->
          <div v-if="showAddMenu" class="add-node-menu" :style="addMenuStyle">
            <div class="add-node-menu-header">添加流程节点</div>
            <div class="add-node-menu-content">
              <div class="add-node-item" @click="addNode('approver')">
                <i class="el-icon-s-check"></i>
                <span>审批人</span>
              </div>
              <div class="add-node-item" @click="addNode('cc')">
                <i class="el-icon-s-promotion"></i>
                <span>抄送人</span>
              </div>
              <div class="add-node-item" @click="addConditionBranch">
                <i class="el-icon-s-grid"></i>
                <span>条件分支</span>
              </div>
              <div class="add-node-item" @click="addParallelBranch">
                <i class="el-icon-s-unfold"></i>
                <span>并行分支</span>
              </div>
              <div class="add-node-item" @click="addNode('delay')">
                <i class="el-icon-time"></i>
                <span>延迟等待</span>
              </div>
              <div class="add-node-item" @click="addNode('trigger')">
                <i class="el-icon-s-marketing"></i>
                <span>触发器</span>
              </div>
            </div>
          </div>
        </el-tab-pane>
        
      </el-tabs>
      
      <!-- 审批人设置对话框 -->
      <el-dialog title="设置审批人" :visible.sync="approverDialogVisible" width="600px">
        <el-form label-width="80px">
          <el-form-item label="审批对象">
            <el-radio-group v-model="approverType">
              <el-radio label="指定人员">指定人员</el-radio>
              <el-radio label="发起人自选">发起人自选</el-radio>
              <el-radio label="连续多级主管">连续多级主管</el-radio>
              <el-radio label="主管">主管</el-radio>
              <el-radio label="角色">角色</el-radio>
              <el-radio label="发起人自己">发起人自己</el-radio>
            </el-radio-group>
          </el-form-item>
          <el-form-item v-if="approverType === '主管'" label="指定主管">
            <el-input v-model="approverLevel" type="number" style="width: 100px" /> 级主管
          </el-form-item>
          <el-form-item label="审批人为空时">
            <el-radio-group v-model="emptyApproverAction">
              <el-radio label="自动通过">自动通过</el-radio>
              <el-radio label="自动驳回">自动驳回</el-radio>
              <el-radio label="转交指定人员">转交指定人员</el-radio>
            </el-radio-group>
          </el-form-item>
          <el-form-item label="审批期限(小时)">
            <el-input v-model="approvalTimeout" type="number" />
          </el-form-item>
        </el-form>
        <div slot="footer" class="dialog-footer">
          <el-button @click="approverDialogVisible = false">取 消</el-button>
          <el-button type="primary" @click="saveApproverSettings">确 定</el-button>
        </div>
      </el-dialog>
      
      <!-- 表单权限设置对话框 -->
      <el-dialog title="设置表单权限" :visible.sync="permissionDialogVisible" width="600px">
        <el-form label-width="80px">
          <el-form-item label="谁可以查看并导出数据">
            <el-select v-model="form.settings.viewer" multiple placeholder="请选择" style="width: 100%">
              <el-option label="部门" value="department" />
              <el-option label="角色" value="role" />
              <el-option label="用户" value="user" />
            </el-select>
          </el-form-item>
        </el-form>
        <div slot="footer" class="dialog-footer">
          <el-button @click="permissionDialogVisible = false">取 消</el-button>
          <el-button type="primary" @click="savePermissionSettings">确 定</el-button>
        </div>
      </el-dialog>
      
      <div slot="footer" class="dialog-footer">
        <el-button @click="cancel">取 消</el-button>
        <el-button type="primary" @click="submitForm">确 定</el-button>
      </div>
    </el-dialog>
  </div>
</template>

<script>
import { listManage, getManage, delManage, addManage, updateManage } from "@/api/system/manage"
import LogicFlow from '@logicflow/core'
import '@logicflow/core/lib/style/index.css'
import { Selection, Dnd, Transform, AdjustLine, Snapline } from '@logicflow/extension'
import '@logicflow/extension/lib/style/index.css'

export default {
  name: "Manage",
  components: {
  },
  data() {
    return {
      
      // 遮罩层
      loading: true,
      // 选中数组
      ids: [],
      // 非单个禁用
      single: true,
      // 非多个禁用
      multiple: true,
      // 显示搜索条件
      showSearch: true,
      // 总条数
      total: 0,
      // 流程管理表格数据
      manageList: [],
      // 弹出层标题
      title: "",
      // 是否显示弹出层
      open: false,
      // 日期范围
      dateRange: [],
      // 当前选中的标签页
      activeTab: 'basic',
      // 列信息
      columns: {
        id: { label: '流程编号', visible: true },
        name: { label: '流程名称', visible: true },
        type: { label: '适用类型', visible: true },
        description: { label: '描述', visible: true },
        active: { label: '状态', visible: true },
        createTime: { label: '创建时间', visible: true }
      },
      // 查询参数
      queryParams: {
        pageNum: 1,
        pageSize: 10,
        name: null,
        type: null,
        active: null
      },
      // 表单参数
      form: {
        id: null,
        name: '',
        type: '',
        description: '',
        active: true,
        group: '',
        remark: '',
        logo: {
          icon: 'el-icon-message',
          background: '#409EFF'
        },
        settings: {
          commiter: [],
          admin: [],
          sign: false,
          notify: {
            type: 'APP',
            title: '流程通知'
          },
          viewer: []
        },
        formItems: [],
        processNodes: []
      },
      // 流程设计器相关
      selectedItem: null,
      selectedFormItem: null,
      selectedNode: null,
      // 流程节点
      flowNodes: [],
      // 条件分支（已废弃，现在条件分支作为特殊节点类型存储在 flowNodes 中）
      conditions: [],
      // 并行分支（已废弃，现在并行分支作为特殊节点类型存储在 flowNodes 中）
      parallelBranches: [],
      // 发起人节点配置
      startNodeConfig: {
        initiator: 'all'
      },
      // 审批人节点配置
      approveNodeConfig: {
        approver: 'specified',
        mode: 'or',
        emptyAction: 'pass'
      },
      // 节点类型库
      nodeTypes: [
        {
          id: 'apply',
          label: '申请',
          type: 'apply',
          icon: 'el-icon-circle-check'
        },
        {
          id: 'approve',
          label: '审批',
          type: 'approve',
          icon: 'el-icon-check'
        },
        {
          id: 'judge',
          label: '判断',
          type: 'judge',
          icon: 'el-icon-s-grid'
        },
        {
          id: 'end',
          label: '结束',
          type: 'end',
          icon: 'el-icon-circle-close'
        }
      ],
      // 表单组件库
      formComponents: [
        { id: 'text', label: '单行文本', icon: 'el-icon-edit', color: '#409EFF' },
        { id: 'textarea', label: '多行文本', icon: 'el-icon-document', color: '#67C23A' },
        { id: 'number', label: '数字输入', icon: 'el-icon-s-finance', color: '#E6A23C' },
        { id: 'money', label: '金额输入', icon: 'el-icon-coin', color: '#FF6B6B' },
        { id: 'radio', label: '单选', icon: 'el-icon-circle-check', color: '#F56C6C' },
        { id: 'checkbox', label: '多选', icon: 'el-icon-check-box', color: '#909399' },
        { id: 'select', label: '下拉选择', icon: 'el-icon-arrow-down', color: '#409EFF' },
        { id: 'datetime', label: '日期时间点', icon: 'el-icon-time', color: '#67C23A' },
        { id: 'daterange', label: '日期时间区间', icon: 'el-icon-date', color: '#67C23A' },
        { id: 'upload', label: '上传', icon: 'el-icon-upload', color: '#E6A23C' },
        { id: 'user', label: '人员选择', icon: 'el-icon-user', color: '#F56C6C' },
        { id: 'department', label: '部门选择', icon: 'el-icon-office-building', color: '#909399' },
        { id: 'description', label: '说明文字', icon: 'el-icon-info', color: '#909399' }
      ],
      // 流程设计器实例
      lf: null,
      // 节点数据
      nodes: [],
      // 连线数据
      lines: [],
      // 审批人设置对话框
      approverDialogVisible: false,
      approverType: '主管',
      approverLevel: 1,
      emptyApproverAction: '自动通过',
      approvalTimeout: 24,
      // 表单权限设置对话框
      permissionDialogVisible: false,
      // 添加节点菜单
      showAddMenu: false,
      addMenuStyle: {},
      currentAddPosition: '',
      currentAddGroupIndex: null,
      currentAddIndex: null,
      currentAddSubIndex: null,
      // 拖拽状态
      isDragOver: false,
      dragComponent: null,
      // 表单校验
      rules: {
        name: [
          { required: true, message: '请输入流程名称', trigger: 'blur' }
        ],
        type: [
          { required: true, message: '请选择适用类型', trigger: 'change' }
        ]
      }
    }
  },
  computed: {
    // 是否有条件分支
    hasConditionBranch() {
      return this.conditions.length > 0
    },
    // 是否有并行分支
    hasParallelBranch() {
      return this.parallelBranches.length > 0
    }
  },
  created() {
    this.getList()
  },
  mounted() {
    // 当流程设计标签页激活时初始化 LogicFlow
    this.$nextTick(() => {
      if (this.activeTab === 'process') {
        this.initLogicFlow()
      }
    })
  },
  watch: {
    activeTab(newTab) {
      if (newTab === 'process') {
        this.$nextTick(() => {
          this.initLogicFlow()
        })
      }
    }
  },
  
  methods: {
    /** 选择节点 */
    selectNode(node) {
      this.selectedNode = node
    },
    
    /** 获取节点图标 */
    getNodeIcon(type) {
      const iconMap = {
        approver: 'el-icon-s-check',
        cc: 'el-icon-s-promotion',
        condition: 'el-icon-s-grid',
        parallel: 'el-icon-s-unfold',
        delay: 'el-icon-time',
        trigger: 'el-icon-s-marketing'
      }
      return iconMap[type] || 'el-icon-s-check'
    },
    
    /** 获取节点标题 */
    getNodeTitle(node) {
      if (node === 'start') return '发起人'
      if (node === 'end') return '流程结束'
      if (node.type === 'approver') return '审批人'
      if (node.type === 'cc') return '抄送人'
      if (node.type === 'condition') return node.name
      if (node.type === 'parallel') return node.name
      if (node.type === 'delay') return '延迟等待'
      if (node.type === 'trigger') return '触发器'
      return '节点配置'
    },
    
    /** 获取默认节点内容 */
    getDefaultNodeContent(type) {
      const contentMap = {
        approver: '请指定审批人',
        cc: '请设置抄送人',
        condition: '请设置条件',
        parallel: '并行任务（同时进行）',
        delay: '请设置延迟时间',
        trigger: '请设置触发器'
      }
      return contentMap[type] || ''
    },
    
    /** 保存节点配置 */
    saveNodeConfig() {
      this.$message.success('保存成功')
      this.selectedNode = null
    },
    
    /** 删除节点 */
    deleteNode(node) {
      if (node.type === 'condition') {
        const index = this.conditions.findIndex(c => c.id === node.id)
        if (index > -1) {
          this.conditions.splice(index, 1)
        }
      } else if (node.type === 'parallel') {
        const index = this.parallelBranches.findIndex(p => p.id === node.id)
        if (index > -1) {
          this.parallelBranches.splice(index, 1)
        }
      } else {
        const index = this.flowNodes.findIndex(n => n.id === node.id)
        if (index > -1) {
          this.flowNodes.splice(index, 1)
        }
      }
      this.$message.success('删除成功')
      this.selectedNode = null
    },
    
    /** 显示添加节点菜单 */
    showAddNodeMenu(event, position, index, groupIndex, subIndex) {
      const rect = event.target.getBoundingClientRect()
      this.addMenuStyle = {
        left: `${rect.left}px`,
        top: `${rect.bottom + 10}px`
      }
      this.showAddMenu = true
      this.currentAddPosition = position
      this.currentAddIndex = index
      this.currentAddGroupIndex = groupIndex
      this.currentAddSubIndex = subIndex

      // 点击其他地方关闭菜单
      setTimeout(() => {
        document.addEventListener('click', this.closeAddNodeMenu)
      }, 0)
    },
    
    /** 关闭添加节点菜单 */
    closeAddNodeMenu() {
      this.showAddMenu = false
      this.currentAddPosition = ''
      this.currentAddGroupIndex = null
      this.currentAddIndex = null
      this.currentAddSubIndex = null
      document.removeEventListener('click', this.closeAddNodeMenu)
    },
    
    /** 添加节点 */
    addNode(type) {
      const newNode = {
        id: Date.now(),
        type: type,
        config: {}
      }
      
      // 根据节点类型设置默认配置
      if (type === 'approver') {
        newNode.config = {
          approver: 'specified',
          mode: 'or',
          emptyAction: 'pass'
        }
      } else if (type === 'cc') {
        newNode.config = {
          cc: 'specified'
        }
      } else if (type === 'delay') {
        newNode.config = {
          time: 1,
          unit: 'minute'
        }
      } else if (type === 'trigger') {
        newNode.config = {
          type: 'webhook',
          url: ''
        }
      }

      // 根据添加位置将节点添加到正确的地方
      if (this.currentAddPosition === 'afterStart') {
        // 在流程开始位置添加节点（插入到 flowNodes 的最前面）
        this.flowNodes.unshift(newNode)
        this.$message.success('添加节点成功')
      } else if (this.currentAddPosition === 'afterNode' && typeof this.currentAddIndex === 'number') {
        // 在指定节点后面添加节点
        this.flowNodes.splice(this.currentAddIndex + 1, 0, newNode)
        this.$message.success('添加节点成功')
      } else if (this.currentAddPosition === 'afterConditionBranch' && typeof this.currentAddIndex === 'number') {
        // 在条件分支节点后面添加节点
        this.flowNodes.splice(this.currentAddIndex + 1, 0, newNode)
        this.$message.success('添加节点成功')
      } else if (this.currentAddPosition === 'afterParallelBranch' && typeof this.currentAddIndex === 'number') {
        // 在并行分支节点后面添加节点
        this.flowNodes.splice(this.currentAddIndex + 1, 0, newNode)
        this.$message.success('添加节点成功')
      } else if (this.currentAddPosition === 'afterConditionSubNode' && this.currentAddGroupIndex !== null && this.currentAddIndex !== null && this.currentAddSubIndex !== null) {
        // 在条件分支的指定子节点后面添加节点
        const conditionBranchNode = this.flowNodes[this.currentAddGroupIndex]
        if (conditionBranchNode && conditionBranchNode.type === 'conditionBranch' && conditionBranchNode.conditions[this.currentAddIndex]) {
          const condition = conditionBranchNode.conditions[this.currentAddIndex]
          if (!condition.nodes) {
            condition.nodes = []
          }
          condition.nodes.splice(this.currentAddSubIndex + 1, 0, newNode)
          this.$message.success('添加节点成功')
        }
      } else if (this.currentAddPosition === 'afterCondition' && this.currentAddGroupIndex !== null && this.currentAddIndex !== null) {
        // 添加到条件分支内部（在条件节点后面添加）
        const conditionBranchNode = this.flowNodes[this.currentAddGroupIndex]
        if (conditionBranchNode && conditionBranchNode.type === 'conditionBranch' && conditionBranchNode.conditions[this.currentAddIndex]) {
          const condition = conditionBranchNode.conditions[this.currentAddIndex]
          if (!condition.nodes) {
            condition.nodes = []
          }
          condition.nodes.unshift(newNode)
          this.$message.success('添加节点成功')
        }
      } else if (this.currentAddPosition === 'afterParallelSubNode' && this.currentAddGroupIndex !== null && this.currentAddIndex !== null && this.currentAddSubIndex !== null) {
        // 在并行分支的指定子节点后面添加节点
        const parallelBranchNode = this.flowNodes[this.currentAddIndex]
        if (parallelBranchNode && parallelBranchNode.type === 'parallelBranch' && parallelBranchNode.branches[this.currentAddGroupIndex]) {
          const branch = parallelBranchNode.branches[this.currentAddGroupIndex]
          if (!branch.nodes) {
            branch.nodes = []
          }
          branch.nodes.splice(this.currentAddSubIndex + 1, 0, newNode)
          this.$message.success('添加节点成功')
        }
      } else if (this.currentAddPosition === 'afterParallel' && this.currentAddGroupIndex !== null && this.currentAddIndex !== null) {
        // 添加到并行分支内部（在分支节点后面添加）
        const parallelBranchNode = this.flowNodes[this.currentAddIndex]
        if (parallelBranchNode && parallelBranchNode.type === 'parallelBranch' && parallelBranchNode.branches[this.currentAddGroupIndex]) {
          const branch = parallelBranchNode.branches[this.currentAddGroupIndex]
          if (!branch.nodes) {
            branch.nodes = []
          }
          branch.nodes.unshift(newNode)
          this.$message.success('添加节点成功')
        }
      } else {
        // 默认添加到主流程末尾
        this.flowNodes.push(newNode)
        this.$message.success('添加节点成功')
      }

      this.showAddMenu = false
      this.currentAddPosition = ''
      this.currentAddGroupIndex = null
      this.currentAddIndex = null
      this.currentAddSubIndex = null
    },
    
    /** 添加条件分支 */
    addConditionBranch() {
      // 创建一个条件分支节点
      const conditionBranchNode = {
        id: Date.now(),
        type: 'conditionBranch',
        conditions: [
          { id: Date.now(), name: '条件1', condition: '', priority: 1, nodes: [] },
          { id: Date.now() + 1, name: '条件2', condition: '', priority: 2, nodes: [] }
        ]
      }
      
      // 根据 currentAddIndex 决定插入位置
      if (typeof this.currentAddIndex === 'number') {
        // 在指定位置插入
        this.flowNodes.splice(this.currentAddIndex + 1, 0, conditionBranchNode)
      } else {
        // 添加到末尾
        this.flowNodes.push(conditionBranchNode)
      }
      
      this.showAddMenu = false
      this.currentAddPosition = ''
      this.currentAddGroupIndex = null
      this.currentAddIndex = null
      this.currentAddSubIndex = null
      this.$message.success('添加条件分支成功')
    },
    
    /** 添加条件 */
    addCondition(groupIndex, conditionIndex) {
      const conditionBranchNode = this.flowNodes[groupIndex]
      if (conditionBranchNode && conditionBranchNode.type === 'conditionBranch') {
        const insertIndex = conditionIndex !== undefined ? conditionIndex + 1 : conditionBranchNode.conditions.length
        const newCondition = {
          id: Date.now(),
          name: `条件${conditionBranchNode.conditions.length + 1}`,
          condition: '',
          priority: conditionBranchNode.conditions.length + 1,
          nodes: []
        }
        conditionBranchNode.conditions.splice(insertIndex, 0, newCondition)
        // 更新所有条件的优先级和名称
        conditionBranchNode.conditions.forEach((condition, idx) => {
          condition.priority = idx + 1
          condition.name = `条件${idx + 1}`
        })
        this.$message.success('添加条件成功')
      }
    },

    /** 删除条件 - 根据条件数量决定删除行为 */
    deleteCondition(groupIndex, index) {
      const conditionBranchNode = this.flowNodes[groupIndex]
      if (conditionBranchNode && conditionBranchNode.type === 'conditionBranch') {
        const conditionGroup = conditionBranchNode.conditions
        if (conditionGroup.length <= 2) {
          // 当条件分支组只有两个或更少条件时，删除整个分支组
          this.flowNodes.splice(groupIndex, 1)
          this.selectedNode = null
          this.$message.success('条件分支已删除')
        } else {
          // 当条件分支组超过两个条件时，只删除对应的条件
          conditionGroup.splice(index, 1)
          // 更新剩余条件的优先级
          conditionGroup.forEach((condition, idx) => {
            condition.priority = idx + 1
            condition.name = `条件${idx + 1}`
          })
          this.selectedNode = null
          this.$message.success('条件分支已删除')
        }
      }
    },

    /** 删除条件分支内的子节点 */
    deleteSubNode(condition, subIndex) {
      if (condition.nodes && condition.nodes.length > subIndex) {
        condition.nodes.splice(subIndex, 1)
        this.$message.success('删除成功')
      }
    },

    /** 添加并行分支 */
    addParallelBranch() {
      // 创建一个并行分支节点
      const parallelBranchNode = {
        id: Date.now(),
        type: 'parallelBranch',
        branches: [
          { id: Date.now(), name: '分支1', content: '并行任务（同时进行）', nodes: [] },
          { id: Date.now() + 1, name: '分支2', content: '并行任务（同时进行）', nodes: [] }
        ]
      }
      
      // 根据 currentAddIndex 决定插入位置
      if (typeof this.currentAddIndex === 'number') {
        // 在指定位置插入
        this.flowNodes.splice(this.currentAddIndex + 1, 0, parallelBranchNode)
      } else {
        // 添加到末尾
        this.flowNodes.push(parallelBranchNode)
      }
      
      this.showAddMenu = false
      this.currentAddPosition = ''
      this.currentAddGroupIndex = null
      this.currentAddIndex = null
      this.currentAddSubIndex = null
      this.$message.success('添加并行分支成功')
    },
    
    /** 在并行分支节点内添加分支 */
    addBranchToParallel(groupIndex, branchIndex) {
      const parallelBranchNode = this.flowNodes[groupIndex]
      if (parallelBranchNode && parallelBranchNode.type === 'parallelBranch') {
        const insertIndex = branchIndex !== undefined ? branchIndex + 1 : parallelBranchNode.branches.length
        const newBranch = {
          id: Date.now(),
          name: `分支${parallelBranchNode.branches.length + 1}`,
          content: '并行任务（同时进行）',
          nodes: []
        }
        parallelBranchNode.branches.splice(insertIndex, 0, newBranch)
        // 更新所有分支的名称
        parallelBranchNode.branches.forEach((branch, idx) => {
          branch.name = `分支${idx + 1}`
        })
        this.$message.success('添加分支成功')
      }
    },
    
    /** 删除并行分支 */
    deleteParallelBranch(groupIndex, index) {
      const parallelBranchNode = this.flowNodes[groupIndex]
      if (parallelBranchNode && parallelBranchNode.type === 'parallelBranch') {
        const parallelGroup = parallelBranchNode.branches
        if (parallelGroup.length <= 2) {
          // 当并行分支组只有两个或更少分支时，删除整个分支组
          this.flowNodes.splice(groupIndex, 1)
          this.selectedNode = null
          this.$message.success('并行分支已删除')
        } else {
          // 当并行分支组超过两个分支时，只删除对应的分支
          parallelGroup.splice(index, 1)
          // 更新剩余分支的名称
          parallelGroup.forEach((branch, idx) => {
            branch.name = `分支${idx + 1}`
          })
          this.selectedNode = null
          this.$message.success('分支已删除')
        }
      }
    },
    
    /** 添加审批人 */
    addApprover() {
      this.$message.info('添加审批人')
    },
    
    /** 分支后添加节点 */
    addAfterBranch() {
      this.$message.info('在分支后添加节点')
    },
    
    /** 初始化流程设计器 */
    initFlowDesigner() {
      // 重置节点和连线数据
      this.nodes = []
      this.lines = []
      this.selectedItem = null
    },
    /** 初始化 LogicFlow - 暂时禁用，使用自定义流程设计器 */
    initLogicFlow() {
      // 由于我们现在使用的是自定义的流程设计器，不再需要LogicFlow
      // 保留此方法以避免控制台报错
    },
    /** 注册节点类型 - 暂时禁用，使用自定义流程设计器 */
    registerNodeTypes() {
      // 由于我们现在使用的是自定义的流程设计器，不再需要注册LogicFlow节点类型
    },
    /** 绑定事件 - 暂时禁用，使用自定义流程设计器 */
    bindEvents() {
      // 由于我们现在使用的是自定义的流程设计器，不再需要绑定LogicFlow事件
    },
    
    /** 切换流程状态 */
    toggleProcess(id, status) {
      this.$confirm('确认要修改该流程的状态吗?', '提示', {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }).then(() => {
        const data = {
          id: id,
          active: status
        }
        updateManage(data).then(response => {
          this.$message.success('修改成功')
          this.getList()
        })
      }).catch(() => {
        this.getList()
      })
    },
    
    /** 新增分组 */
    addGroup() {
      this.$prompt('请输入分组名称', '新增分组', {
        confirmButtonText: '确定',
        cancelButtonText: '取消'
      }).then(({ value }) => {
        this.$message.success('分组添加成功')
      }).catch(() => {
        this.$message.info('取消添加')
      })
    },
    
    /** 开始拖拽 */
    handleDragStart(event, component) {
      this.dragComponent = component
      event.dataTransfer.effectAllowed = 'copy'
      event.dataTransfer.setData('text/plain', JSON.stringify(component))
    },
    
    /** 拖拽经过 */
    handleDragOver(event) {
      event.preventDefault()
      event.dataTransfer.dropEffect = 'copy'
      this.isDragOver = true
    },
    
    /** 拖拽离开 */
    handleDragLeave(event) {
      this.isDragOver = false
    },
    
    /** 放置组件 */
    handleDrop(event) {
      event.preventDefault()
      this.isDragOver = false
      
      if (this.dragComponent) {
        this.addFormComponent(this.dragComponent.id, this.dragComponent.label)
        this.dragComponent = null
      }
    },
    
    /** 添加表单组件 */
    addFormComponent(type, label) {
      const newComponent = {
        id: Date.now(),
        type: type,
        label: label,
        field: label.toLowerCase().replace(/\s+/g, '_'),
        required: false,
        placeholder: `请输入${label}`,
        options: []
      }
      
      // 根据组件类型设置默认属性
      if (type === 'money') {
        newComponent.precision = 2
      } else if (type === 'datetime' || type === 'daterange') {
        newComponent.format = 'yyyy-MM-dd'
      } else if (type === 'description') {
        newComponent.description = '说明文字内容'
        newComponent.style = 'normal'
      } else if (['select', 'radio', 'checkbox'].includes(type)) {
        newComponent.options = [
          { label: '选项1', value: '1' },
          { label: '选项2', value: '2' }
        ]
      }
      
      this.form.formItems.push(newComponent)
      this.$message.success('添加组件成功')
    },
    
    /** 选择表单组件 */
    selectFormItem(item) {
      this.selectedFormItem = item
    },
    
    /** 编辑表单组件 */
    editFormComponent(item) {
      this.selectedFormItem = item
    },
    
    /** 删除表单组件 */
    deleteFormComponent(index) {
      this.form.formItems.splice(index, 1)
      this.$message.success('删除组件成功')
      if (this.selectedFormItem) {
        this.selectedFormItem = null
      }
    },
    
    /** 更新表单组件 */
    updateFormComponent() {
      this.$message.success('更新组件成功')
    },
    
    /** 添加选项 */
    addOption() {
      if (this.selectedFormItem) {
        this.selectedFormItem.options.push({ label: `选项${this.selectedFormItem.options.length + 1}`, value: `${this.selectedFormItem.options.length + 1}` })
      }
    },
    
    /** 移除选项 */
    removeOption(index) {
      if (this.selectedFormItem) {
        this.selectedFormItem.options.splice(index, 1)
      }
    },
    
    /** 保存审批人设置 */
    saveApproverSettings() {
      this.approverDialogVisible = false
      this.$message.success('保存成功')
    },
    
    /** 保存权限设置 */
    savePermissionSettings() {
      this.permissionDialogVisible = false
      this.$message.success('保存成功')
    },
    
    /** 导入 */
    handleImport() {
      this.$refs.upload.click()
    },
    
    /** 导出 */
    handleExport() {
      this.download('system/manage/export', { ...this.queryParams }, `manage_${new Date().getTime()}.xlsx`)
    },
    
    /** 查询列表 */
    getList() {
      this.loading = true
      listManage(this.queryParams).then(response => {
        this.manageList = response.rows
        this.total = response.total
        this.loading = false
      })
    },
    
    /** 搜索按钮操作 */
    handleQuery() {
      this.queryParams.pageNum = 1
      this.getList()
    },
    
    /** 重置按钮操作 */
    resetQuery() {
      this.dateRange = []
      this.resetForm("queryForm")
      this.handleQuery()
    },
    
    /** 新增按钮操作 */
    handleAdd() {
      this.reset()
      this.open = true
      this.title = "添加流程管理"
    },
    
    /** 修改按钮操作 */
    handleUpdate(row) {
      this.reset()
      const id = row.id || this.ids
      getManage(id).then(response => {
        this.form = response.data
        this.open = true
        this.title = "修改流程管理"
      })
    },
    
    /** 提交按钮 */
    submitForm() {
      // 收集三个模块的数据
      const progressContent = {
        // 1. 基础设置数据
        basicSettings: {
          name: this.form.name,
          group: this.form.group,
          description: this.form.description,
          settings: this.form.settings,
          active: this.form.active,
          logo: this.form.logo,
          type: this.form.type
        },
        // 2. 审批表单数据
        approvalForm: {
          formItems: this.form.formItems,
          formCount: this.form.formItems.length
        },
        // 3. 审批流程数据
        approvalProcess: {
          flowNodes: this.flowNodes,
          startNodeConfig: this.startNodeConfig,
          nodeCount: this.flowNodes.length
        }
      }
      
      // 在控制台打印收集的数据
      console.log('==================== 流程管理 - 提交数据 ====================')
      console.log('progressContent:', JSON.parse(JSON.stringify(progressContent)))
      console.log('=========================================================')
      
      // 构建提交数据，将收集的内容用 progressContent 参数名包装
      const submitParams = {
        ...this.form,
        progressContent: JSON.stringify(progressContent)
      }
      
      // 表单验证和提交逻辑
      if (this.form.id != null) {
        updateManage(submitParams).then(response => {
          this.$message.success("修改成功")
          this.open = false
          this.getList()
        })
      } else {
        addManage(submitParams).then(response => {
          this.$message.success("新增成功")
          this.open = false
          this.getList()
        })
      }
    },
    
    /** 取消按钮 */
    cancel() {
      this.open = false
      this.reset()
    },
    
    /** 表单重置 */
    reset() {
      this.form = {
        id: null,
        name: '',
        type: '',
        description: '',
        active: true,
        group: '',
        remark: '',
        logo: {
          icon: 'el-icon-message',
          background: '#409EFF'
        },
        settings: {
          commiter: [],
          admin: [],
          sign: false,
          notify: {
            type: 'APP',
            title: '流程通知'
          },
          viewer: []
        },
        formItems: [],
        processNodes: []
      }
      this.resetForm("form")
    },
    
    /** 获取流程类型标签 */
    getProcessTypeLabel(type) {
      const typeMap = {
        'expense': '费用报销',
        'leave': '请假申请',
        'purchase': '采购申请',
        'business': '出差申请'
      }
      return typeMap[type] || type
    },
    
    /** 多选框选中数据 */
    handleSelectionChange(selection) {
      this.ids = selection.map(item => item.id)
      this.single = selection.length !== 1
      this.multiple = !selection.length
    },
    
    /** 删除按钮操作 */
    handleDelete(row) {
      const ids = row.id || this.ids
      this.$confirm('确定要删除选中的流程吗?', '警告', {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }).then(() => {
        return delManage(ids)
      }).then(() => {
        this.getList()
        this.$message.success('删除成功')
      }).catch(() => {
        this.getList()
      })
    }
  }
}
</script>

<style scoped>
/* 弹层样式 - 上下撑满 */
.process-design-dialog >>> .el-dialog {
  margin-top: 5vh !important;
  margin-bottom: 5vh !important;
  height: 90vh;
  display: flex;
  flex-direction: column;
}

.process-design-dialog >>> .el-dialog__body {
  flex: 1;
  overflow: hidden;
  padding: 20px;
}

.process-design-dialog >>> .el-tabs {
  height: 100%;
  display: flex;
  flex-direction: column;
}

.process-design-dialog >>> .el-tabs__content {
  flex: 1;
  overflow: auto;
}

/* 审批流程样式 - 参考wflow-workflow */
.approval-flow-wrapper {
  display: flex;
  height: 600px;
  gap: 20px;
}

.approval-flow-canvas {
  flex: 1;
  background-color: #f5f7fa;
  border-radius: 4px;
  padding: 20px;
  overflow-y: auto;
}

.approval-flow-container {
  position: relative;
  min-width: 500px;
  display: flex;
  flex-direction: column;
  align-items: center;
}

/* 流程节点样式 - 白色背景带顶部彩色条 */
.flow-node {
  width: 220px;
  margin: 0 auto;
  background-color: white;
  border-radius: 4px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  cursor: pointer;
  transition: all 0.3s ease;
  overflow: hidden;
}

.flow-node:hover {
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.15);
}

/* 发起人节点 - 蓝色顶部条 */
.flow-node.start-node .node-header {
  background-color: #409EFF;
  color: white;
}

/* 审批人节点 - 橙色顶部条 */
.flow-node.approver-node .node-header {
  background-color: #E6A23C;
  color: white;
}

/* 抄送人节点 - 绿色顶部条 */
.flow-node.cc-node .node-header {
  background-color: #67C23A;
  color: white;
}

/* 延迟等待节点 - 灰色顶部条 */
.flow-node.delay-node .node-header {
  background-color: #909399;
  color: white;
}

/* 触发器节点 - 红色顶部条 */
.flow-node.trigger-node .node-header {
  background-color: #F56C6C;
  color: white;
}

/* 流程结束节点 - 灰色圆角矩形 */
.flow-node.end-node {
  background-color: #f5f7fa;
  border: 1px solid #dcdfe6;
  color: #606266;
  text-align: center;
  padding: 12px 30px;
  border-radius: 20px;
  width: auto;
  min-width: 100px;
  box-shadow: none;
}

.flow-node.end-node .node-content {
  padding: 0;
  justify-content: center;
}

.node-header {
  padding: 10px 15px;
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 14px;
  font-weight: 500;
  position: relative;
}

/* 节点删除按钮 - 默认隐藏，悬停显示 */
.node-delete-btn {
  position: absolute;
  right: 10px;
  top: 50%;
  transform: translateY(-50%);
  width: 20px;
  height: 20px;
  border-radius: 50%;
  background-color: rgba(255, 255, 255, 0.9);
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  opacity: 0;
  transition: opacity 0.3s ease;
}

.node-delete-btn i {
  font-size: 12px;
  color: #f56c6c;
}

.flow-node:hover .node-delete-btn {
  opacity: 1;
}

.node-delete-btn:hover {
  background-color: #f56c6c;
}

.node-delete-btn:hover i {
  color: white;
}

.node-content {
  padding: 15px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  color: #606266;
  font-size: 14px;
}

.node-content .el-icon-arrow-right {
  color: #c0c4cc;
}

/* 连接线样式 */
.flow-line {
  position: relative;
  height: 50px;
  display: flex;
  justify-content: center;
  align-items: center;
}

.flow-line::before {
  content: '';
  position: absolute;
  top: 0;
  left: 50%;
  width: 2px;
  height: 100%;
  background-color: #c0c4cc;
  transform: translateX(-50%);
}

/* 添加按钮样式 - 蓝色圆形 */
.add-btn {
  position: relative;
  z-index: 1;
  width: 28px;
  height: 28px;
  border-radius: 50%;
  background-color: #409EFF;
  border: none;
  display: flex;
  justify-content: center;
  align-items: center;
  cursor: pointer;
  box-shadow: 0 2px 4px rgba(64, 158, 255, 0.3);
  transition: all 0.3s ease;
}

.add-btn:hover {
  background-color: #66b1ff;
  transform: scale(1.1);
}

.add-btn i {
  font-size: 14px;
  color: white;
}

/* 分支容器样式 - 使用CSS Grid精确控制连线 */
.condition-branch-container,
.parallel-branch-container {
  margin: 0;
  width: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
}

/* 分支头部样式 - 入口连接线 */
.branch-header {
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: -16px;
  position: relative;
  width: 100%;
}

/* 入口垂直线 - 从上方节点连接到水平线 */
.branch-header::before {
  content: '';
  position: absolute;
  top: -25px;
  left: 50%;
  transform: translateX(-50%);
  width: 2px;
  height: 25px;
  background-color: #c0c4cc;
}

.branch-line-left,
.branch-line-right {
  flex: 1;
  height: 2px;
  background-color: #c0c4cc;
  max-width: 200px;
}

.add-condition-btn,
.add-branch-btn {
  padding: 6px 16px;
  background-color: white;
  color: #409EFF;
  border: 1px solid #409EFF;
  border-radius: 4px;
  font-size: 13px;
  cursor: pointer;
  transition: all 0.3s ease;
  margin: 0 10px;
  position: relative;
  z-index: 2;
}

.add-condition-btn:hover,
.add-branch-btn:hover {
  background-color: #409EFF;
  color: white;
}

/* 分支内容样式 - 水平排列 */
.branch-content {
  display: flex;
  justify-content: center;
  width: 100%;
  position: relative;
  padding-top: 0;
}

/* 分支节点容器 */
.branch-nodes {
  display: flex;
  flex-direction: row;
  justify-content: center;
  gap: 60px;
  position: relative;
  padding: 0 20px;
}

/* 顶部分支水平连接线 - 动态计算宽度 */
.branch-content::before {
  content: '';
  position: absolute;
  top: 0;
  left: 50%;
  transform: translateX(-50%);
  width: var(--branch-width, 280px);
  height: 2px;
  background-color: #c0c4cc;
}

.branch-node-wrapper {
  display: flex;
  flex-direction: column;
  align-items: center;
  position: relative;
  padding-top: 20px;
}

/* 从顶部分支线到每个节点的垂直线 - 精确对齐 */
.branch-node-wrapper::before {
  content: '';
  position: absolute;
  top: 0;
  left: 50%;
  transform: translateX(-50%);
  width: 2px;
  height: 20px;
  background-color: #c0c4cc;
  z-index: 1;
}

/* 分支节点样式 */
.branch-node {
  width: 220px;
  background-color: white;
  border-radius: 4px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  cursor: pointer;
  transition: all 0.3s ease;
  overflow: hidden;
}

.branch-node:hover {
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.15);
}

.branch-node-header {
  padding: 12px 15px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 14px;
  font-weight: 500;
  border-bottom: 1px solid #ebeef5;
  position: relative;
}

/* 条件节点删除按钮 - 默认隐藏，悬停显示 */
.branch-delete-btn {
  position: absolute;
  right: 10px;
  top: 50%;
  transform: translateY(-50%);
  width: 20px;
  height: 20px;
  border-radius: 50%;
  background-color: rgba(245, 108, 108, 0.1);
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  opacity: 0;
  transition: opacity 0.3s ease;
}

.branch-delete-btn i {
  font-size: 12px;
  color: #f56c6c;
}

.branch-node:hover .branch-delete-btn {
  opacity: 1;
}

.branch-delete-btn:hover {
  background-color: #f56c6c;
}

.branch-delete-btn:hover i {
  color: white;
}

.branch-node-name {
  color: #409EFF;
}

.branch-node-priority {
  font-size: 12px;
  color: #67C23A;
}

.branch-node-content {
  padding: 15px;
  font-size: 13px;
  color: #606266;
}

/* 分支垂直连接线 - 从节点到底部水平线 */
.branch-line-vertical {
  position: relative;
  height: 40px;
  display: flex;
  justify-content: center;
  align-items: center;
  margin-top: 0;
}

.branch-line-vertical::before {
  content: '';
  position: absolute;
  top: 0;
  left: 50%;
  transform: translateX(-50%);
  width: 2px;
  height: 100%;
  background-color: #c0c4cc;
}

/* 分支底部样式 - 出口连接线 */
.branch-footer {
  display: flex;
  align-items: center;
  justify-content: center;
  margin-top: 0;
  position: relative;
  width: 100%;
  height: 40px;
}

/* 底部分支水平连接线 - 动态计算宽度 */
.branch-footer::before {
  content: '';
  position: absolute;
  top: 0;
  left: 50%;
  transform: translateX(-50%);
  width: var(--branch-width, 280px);
  height: 2px;
  background-color: #c0c4cc;
}

/* 出口垂直线 - 从水平线连接到下方节点 */
.branch-footer::after {
  content: '';
  position: absolute;
  top: 0;
  left: 50%;
  transform: translateX(-50%);
  width: 2px;
  height: 40px;
  background-color: #c0c4cc;
}

/* 分支底部左右延伸线 */
.branch-footer .branch-line-left,
.branch-footer .branch-line-right {
  flex: 1;
  height: 2px;
  background-color: #c0c4cc;
  max-width: 200px;
}

/* 右侧属性面板样式 */
.node-property-panel {
  width: 300px;
  background-color: white;
  border-radius: 4px;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);
  overflow: hidden;
}

.panel-header {
  padding: 15px;
  border-bottom: 1px solid #ebeef5;
  display: flex;
  justify-content: space-between;
  align-items: center;
  background-color: #f5f7fa;
}

.panel-header h3 {
  margin: 0;
  font-size: 16px;
  font-weight: 500;
  color: #303133;
}

.panel-content {
  padding: 15px;
  max-height: 500px;
  overflow-y: auto;
}

.panel-actions {
  margin-top: 20px;
  display: flex;
  gap: 10px;
  justify-content: flex-end;
}

/* 添加节点菜单样式 */
.add-node-menu {
  position: fixed;
  background-color: white;
  border-radius: 4px;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.15);
  z-index: 1000;
  min-width: 180px;
}

.add-node-menu-header {
  padding: 10px 15px;
  border-bottom: 1px solid #ebeef5;
  font-size: 14px;
  font-weight: 500;
  color: #303133;
}

.add-node-menu-content {
  padding: 8px;
  display: grid;
  grid-template-columns: 1fr 1fr 1fr;
  grid-template-rows: repeat(2, 1fr);
  gap: 8px;
  min-width: 280px;
}

.add-node-item {
  padding: 8px 10px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 4px;
  cursor: pointer;
  transition: all 0.3s ease;
  border-radius: 4px;
  min-height: 40px;
}

.add-node-item:hover {
  background-color: #ecf5ff;
  color: #409EFF;
}

.add-node-item i {
  font-size: 20px;
  margin-bottom: 4px;
}

.add-node-item span {
  font-size: 12px;
  text-align: center;
}

/* 流程设计器标签页样式 */
.process-tabs {
  margin-bottom: 20px;
}

/* 基础设置样式 */
.wflow-basic-setting {
  padding: 20px;
  background-color: white;
  border-radius: 4px;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);
}

.setting-section {
  margin-bottom: 20px;
}

.section-title {
  margin-bottom: 10px;
  font-size: 14px;
  font-weight: 500;
  color: #303133;
}

.group-setting {
  display: flex;
  align-items: center;
  gap: 10px;
}

/* 表单设计器样式 */
.wflow-form-designer {
  display: flex;
  gap: 20px;
  height: 600px;
}

.component-library {
  width: 200px;
  background-color: white;
  border-radius: 4px;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);
  padding: 15px;
  overflow-y: auto;
}

.library-header {
  margin-bottom: 15px;
}

.library-title {
  font-size: 16px;
  font-weight: 500;
  color: #303133;
  margin-bottom: 5px;
}

.library-subtitle {
  font-size: 12px;
  color: #909399;
}

.components {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 10px;
}

.component-item {
  padding: 10px;
  border: 1px solid #ebeef5;
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.3s ease;
  text-align: center;
}

.component-item:hover {
  border-color: #409EFF;
  background-color: #ecf5ff;
}

.component-icon {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  display: flex;
  justify-content: center;
  align-items: center;
  margin: 0 auto 5px;
}

.component-icon i {
  font-size: 20px;
}

.component-label {
  font-size: 12px;
  color: #303133;
}

.form-design-area {
  flex: 1;
  background-color: white;
  border-radius: 4px;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);
  display: flex;
  flex-direction: column;
  transition: all 0.3s ease;
}
.form-design-area.drag-over {
  border: 2px dashed #409EFF;
  background-color: #ecf5ff;
  box-shadow: 0 2px 12px 0 rgba(64, 158, 255, 0.3);
}
/* 组件拖拽时的样式 */
.component-item {
  cursor: grab;
  user-select: none;
  transition: all 0.2s ease;
}
.component-item:active {
  cursor: grabbing;
}
.component-item:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

.design-header {
  padding: 15px;
  border-bottom: 1px solid #ebeef5;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.header-left h4 {
  margin: 0;
  font-size: 16px;
  font-weight: 500;
  color: #303133;
}

.form-count {
  font-size: 12px;
  color: #909399;
  margin-top: 5px;
}

.design-actions {
  display: flex;
  gap: 10px;
}

.form-preview {
  flex: 1;
  padding: 20px;
  overflow-y: auto;
  background-color: #f5f7fa;
}

.empty-form {
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  height: 100%;
  color: #909399;
}

.empty-icon {
  width: 80px;
  height: 80px;
  border-radius: 50%;
  background-color: #ecf5ff;
  display: flex;
  justify-content: center;
  align-items: center;
  margin-bottom: 15px;
}

.empty-icon i {
  font-size: 40px;
  color: #409EFF;
}

.form-content {
  display: flex;
  flex-direction: column;
  gap: 15px;
}

.form-item {
  background-color: white;
  border: 1px solid #ebeef5;
  border-radius: 4px;
  padding: 15px;
  cursor: pointer;
  transition: all 0.3s ease;
}

.form-item:hover {
  border-color: #409EFF;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.form-item.selected {
  border-color: #409EFF;
  box-shadow: 0 0 0 2px rgba(64, 158, 255, 0.2);
}

.item-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 10px;
}

.item-left {
  display: flex;
  align-items: center;
  gap: 10px;
}

.item-icon {
  width: 32px;
  height: 32px;
  border-radius: 4px;
  display: flex;
  justify-content: center;
  align-items: center;
}

.item-icon i {
  font-size: 16px;
}

.item-label {
  font-size: 14px;
  font-weight: 500;
  color: #303133;
}

.item-actions {
  display: flex;
  gap: 5px;
}

.item-preview {
  padding: 10px;
  background-color: #f5f7fa;
  border-radius: 4px;
}

.daterange-preview {
  display: flex;
  align-items: center;
  gap: 10px;
}

.daterange-item {
  flex: 1;
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 12px;
  background-color: white;
  border: 1px solid #dcdfe6;
  border-radius: 4px;
}

.daterange-label {
  font-size: 12px;
  color: #909399;
  white-space: nowrap;
}

.daterange-input {
  flex: 1;
  display: flex;
  align-items: center;
  gap: 5px;
  color: #909399;
  font-size: 12px;
}

.daterange-separator {
  color: #909399;
}

.description-preview {
  padding: 10px;
  border-radius: 4px;
  line-height: 1.5;
}

.description-preview.info {
  background-color: #ecf5ff;
  color: #409EFF;
  border-left: 4px solid #409EFF;
}

.description-preview.warning {
  background-color: #fdf6ec;
  color: #E6A23C;
  border-left: 4px solid #E6A23C;
}

.description-preview.success {
  background-color: #f0f9eb;
  color: #67C23A;
  border-left: 4px solid #67C23A;
}

.description-preview.danger {
  background-color: #fef0f0;
  color: #F56C6C;
  border-left: 4px solid #F56C6C;
}

.form-property-panel {
  width: 300px;
  background-color: white;
  border-radius: 4px;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);
  overflow: hidden;
}

.options-setting {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.option-item {
  display: flex;
  align-items: center;
  gap: 10px;
}

/* 响应式设计 */
@media (max-width: 1200px) {
  .approval-flow-wrapper {
    flex-direction: column;
    height: auto;
  }
  
  .node-property-panel {
    width: 100%;
    margin-top: 20px;
  }
  
  .wflow-form-designer {
    flex-direction: column;
    height: auto;
  }
  
  .component-library {
    width: 100%;
    max-height: 200px;
  }
  
  .components {
    grid-template-columns: repeat(4, 1fr);
  }
  
  .form-design-area {
    margin-top: 20px;
    min-height: 500px;
  }
  
  .form-property-panel {
    width: 100%;
    margin-top: 20px;
  }
}
</style>