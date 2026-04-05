<template>
  <div class="app-container">
    <el-form :model="queryParams" ref="queryForm" size="small" :inline="true" v-show="showSearch">
      <el-form-item label="审批标题" prop="title">
        <el-input v-model="queryParams.title" placeholder="请输入标题" clearable style="width: 200px" @keyup.enter.native="handleQuery" />
      </el-form-item>
      <el-form-item label="状态" prop="status">
        <el-select v-model="queryParams.status" placeholder="请选择状态" clearable style="width: 150px">
          <el-option label="待审批" :value="0" />
          <el-option label="审批中" :value="1" />
          <el-option label="已通过" :value="2" />
          <el-option label="已拒绝" :value="3" />
          <el-option label="已撤销" :value="4" />
        </el-select>
      </el-form-item>
      <el-form-item>
        <el-button type="primary" icon="el-icon-search" size="mini" @click="handleQuery">搜索</el-button>
        <el-button icon="el-icon-refresh" size="mini" @click="resetQuery">重置</el-button>
      </el-form-item>
    </el-form>

    <el-table v-loading="loading" :data="instanceList">
      <el-table-column label="编号" align="center" prop="id" width="70" />
      <el-table-column label="审批标题" align="center" prop="title" :show-overflow-tooltip="true" />
      <el-table-column label="模板" align="center" prop="snapshotTemplateName" :show-overflow-tooltip="true" />
      <el-table-column label="发起人" align="center" prop="promoterLegalName" width="120" />
      <el-table-column label="紧急度" align="center" prop="urgency" width="80">
        <template slot-scope="scope">
          <el-tag :type="scope.row.urgency === 2 ? 'danger' : scope.row.urgency === 1 ? 'warning' : 'info'" size="small">
            {{ ['普通', '紧急', '特急'][scope.row.urgency || 0] }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column label="状态" align="center" prop="status" width="90">
        <template slot-scope="scope">
          <el-tag :type="statusTagType(scope.row.status)" size="small">
            {{ statusLabel(scope.row.status) }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column label="发起时间" align="center" prop="createTime" width="160">
        <template slot-scope="scope">
          <span>{{ parseTime(scope.row.createTime) }}</span>
        </template>
      </el-table-column>
      <el-table-column label="完成时间" align="center" prop="finishTime" width="160">
        <template slot-scope="scope">
          <span>{{ parseTime(scope.row.finishTime) }}</span>
        </template>
      </el-table-column>
      <el-table-column label="操作" align="center" width="120">
        <template slot-scope="scope">
          <el-button size="mini" type="text" icon="el-icon-view" @click="handleDetail(scope.row)">详情</el-button>
        </template>
      </el-table-column>
    </el-table>

    <pagination v-show="total > 0" :total="total" :page.sync="queryParams.pageNum" :limit.sync="queryParams.pageSize" @pagination="getList" />

    <!-- 审批详情弹窗 -->
    <el-dialog title="审批详情" :visible.sync="detailOpen" width="700px" append-to-body>
      <div v-if="currentInstance">
        <el-descriptions :column="2" border>
          <el-descriptions-item label="标题">{{ currentInstance.title }}</el-descriptions-item>
          <el-descriptions-item label="模板">{{ currentInstance.snapshotTemplateName }}</el-descriptions-item>
          <el-descriptions-item label="发起人">{{ currentInstance.promoterLegalName }}</el-descriptions-item>
          <el-descriptions-item label="状态">
            <el-tag :type="statusTagType(currentInstance.status)" size="small">{{ statusLabel(currentInstance.status) }}</el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="发起时间">{{ parseTime(currentInstance.createTime) }}</el-descriptions-item>
          <el-descriptions-item label="完成时间">{{ parseTime(currentInstance.finishTime) }}</el-descriptions-item>
          <el-descriptions-item label="备注" :span="2">{{ currentInstance.remark || '无' }}</el-descriptions-item>
        </el-descriptions>

        <!-- 表单数据 -->
        <div v-if="parsedFormData && Object.keys(parsedFormData).length > 0" style="margin-top: 20px">
          <h4>表单数据</h4>
          <el-descriptions :column="1" border>
            <el-descriptions-item v-for="(value, key) in parsedFormData" :key="key" :label="key">
              {{ value }}
            </el-descriptions-item>
          </el-descriptions>
        </div>

        <!-- 审批节点 -->
        <div v-if="instanceNodes.length > 0" style="margin-top: 20px">
          <h4>审批流程</h4>
          <el-steps :active="currentNodeStep" finish-status="success" direction="vertical" style="margin-top: 10px">
            <el-step v-for="node in instanceNodes" :key="node.id" :title="node.content || node.type" :description="getNodeDesc(node)">
              <template slot="icon">
                <i :class="node.status === 1 ? 'el-icon-check' : node.status === 0 ? 'el-icon-loading' : 'el-icon-more'" />
              </template>
            </el-step>
          </el-steps>
        </div>
      </div>
    </el-dialog>
  </div>
</template>

<script>
import request from '@/utils/request'

export default {
  name: 'ApprovalInstance',
  data() {
    return {
      loading: true,
      showSearch: true,
      instanceList: [],
      total: 0,
      queryParams: {
        pageNum: 1,
        pageSize: 10,
        title: null,
        status: null
      },
      detailOpen: false,
      currentInstance: null,
      parsedFormData: {},
      instanceNodes: [],
      currentNodeStep: 0
    }
  },
  created() {
    this.getList()
  },
  methods: {
    getList() {
      this.loading = true
      request({
        url: '/system/instance/list',
        method: 'get',
        params: this.queryParams
      }).then(response => {
        this.instanceList = response.rows || response.data || []
        this.total = response.total || 0
        this.loading = false
      }).catch(() => {
        this.loading = false
      })
    },
    handleQuery() {
      this.queryParams.pageNum = 1
      this.getList()
    },
    resetQuery() {
      this.resetForm('queryForm')
      this.handleQuery()
    },
    handleDetail(row) {
      this.currentInstance = row
      // 解析表单数据
      try {
        this.parsedFormData = JSON.parse(row.formData || '{}')
      } catch (e) {
        this.parsedFormData = {}
      }
      // 获取审批节点
      // TODO: 调用节点查询接口
      this.instanceNodes = []
      this.detailOpen = true
    },
    statusLabel(status) {
      const map = { 0: '待审批', 1: '审批中', 2: '已通过', 3: '已拒绝', 4: '已撤销' }
      return map[status] || '未知'
    },
    statusTagType(status) {
      const map = { 0: 'warning', 1: '', 2: 'success', 3: 'danger', 4: 'info' }
      return map[status] || 'info'
    },
    getNodeDesc(node) {
      const statusMap = { 0: '待处理', 1: '已完成' }
      let desc = statusMap[node.status] || ''
      if (node.finishTime) {
        desc += ' · ' + this.parseTime(node.finishTime)
      }
      return desc
    }
  }
}
</script>
