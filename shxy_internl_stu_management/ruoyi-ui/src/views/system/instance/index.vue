<template>
  <div class="app-container">
    <el-form :model="queryParams" ref="queryForm" size="small" :inline="true" v-show="showSearch" label-width="68px">
      <el-form-item label="流程模板id" prop="templateId">
        <el-input
          v-model="queryParams.templateId"
          placeholder="请输入流程模板id"
          clearable
          @keyup.enter.native="handleQuery"
        />
      </el-form-item>
      <el-form-item label="审批标题" prop="title">
        <el-input
          v-model="queryParams.title"
          placeholder="请输入审批标题"
          clearable
          @keyup.enter.native="handleQuery"
        />
      </el-form-item>
      <el-form-item label="类型" prop="urgency">
        <el-input
          v-model="queryParams.urgency"
          placeholder="请输入类型"
          clearable
          @keyup.enter.native="handleQuery"
        />
      </el-form-item>
      <el-form-item label="发起人user_id" prop="promoterUserId">
        <el-input
          v-model="queryParams.promoterUserId"
          placeholder="请输入发起人user_id"
          clearable
          @keyup.enter.native="handleQuery"
        />
      </el-form-item>
      <el-form-item label="发起人法定姓名" prop="promoterLegalName">
        <el-input
          v-model="queryParams.promoterLegalName"
          placeholder="请输入发起人法定姓名"
          clearable
          @keyup.enter.native="handleQuery"
        />
      </el-form-item>
      <el-form-item label="当前审批节点id" prop="currentNodeId">
        <el-input
          v-model="queryParams.currentNodeId"
          placeholder="请输入当前审批节点id"
          clearable
          @keyup.enter.native="handleQuery"
        />
      </el-form-item>
      <el-form-item label="审核完成时间" prop="finishTime">
        <el-date-picker clearable
          v-model="queryParams.finishTime"
          type="date"
          value-format="yyyy-MM-dd"
          placeholder="请选择审核完成时间">
        </el-date-picker>
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
          v-hasPermi="['system:instance:add']"
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
          v-hasPermi="['system:instance:edit']"
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
          v-hasPermi="['system:instance:remove']"
        >删除</el-button>
      </el-col>
      <el-col :span="1.5">
        <el-button
          type="warning"
          plain
          icon="el-icon-download"
          size="mini"
          @click="handleExport"
          v-hasPermi="['system:instance:export']"
        >导出</el-button>
      </el-col>
      <right-toolbar :showSearch.sync="showSearch" @queryTable="getList"></right-toolbar>
    </el-row>

    <el-table v-loading="loading" :data="instanceList" @selection-change="handleSelectionChange">
      <el-table-column type="selection" width="55" align="center" />
      <el-table-column label="序号" align="center" prop="id" />
      <!-- <el-table-column label="流程模板id" align="center" prop="templateId" /> -->
      <el-table-column label="审批标题" align="center" prop="title" />
      <!-- <el-table-column label="提交表单数据" align="center" prop="formData" /> -->
      <el-table-column label="状态" align="center" prop="status" />
      <el-table-column label="类型" align="center" prop="urgency" />
      <!-- <el-table-column label="发起人user_id" align="center" prop="promoterUserId" /> -->
      <el-table-column label="发起人" align="center" prop="promoterLegalName" />
      <el-table-column label="当前审批节点" align="center" prop="currentNodeId" />
      <el-table-column label="审核完成时间" align="center" prop="finishTime" width="180">
        <template slot-scope="scope">
          <span>{{ parseTime(scope.row.finishTime, '{y}-{m}-{d}') }}</span>
        </template>
      </el-table-column>
      <el-table-column label="操作" align="center" class-name="small-padding fixed-width">
        <template slot-scope="scope">
          <el-button
            size="mini"
            type="text"
            icon="el-icon-edit"
            @click="handleUpdate(scope.row)"
            v-hasPermi="['system:instance:edit']"
          >修改</el-button>
          <el-button
            size="mini"
            type="text"
            icon="el-icon-delete"
            @click="handleDelete(scope.row)"
            v-hasPermi="['system:instance:remove']"
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

    <!-- 添加或修改审批实例对话框 -->
    <el-dialog :title="title" :visible.sync="open" width="500px" append-to-body>
      <el-form ref="form" :model="form" :rules="rules" label-width="80px">
        <el-form-item label="流程模板id" prop="templateId">
          <el-input v-model="form.templateId" placeholder="请输入流程模板id" />
        </el-form-item>
        <el-form-item label="审批标题" prop="title">
          <el-input v-model="form.title" placeholder="请输入审批标题" />
        </el-form-item>
        <el-form-item label="提交表单数据" prop="formData">
          <el-input v-model="form.formData" type="textarea" placeholder="请输入内容" />
        </el-form-item>
        <el-form-item label="类型" prop="urgency">
          <el-input v-model="form.urgency" placeholder="请输入类型" />
        </el-form-item>
        <el-form-item label="发起人user_id" prop="promoterUserId">
          <el-input v-model="form.promoterUserId" placeholder="请输入发起人user_id" />
        </el-form-item>
        <el-form-item label="发起人法定姓名" prop="promoterLegalName">
          <el-input v-model="form.promoterLegalName" placeholder="请输入发起人法定姓名" />
        </el-form-item>
        <el-form-item label="当前审批节点id" prop="currentNodeId">
          <el-input v-model="form.currentNodeId" placeholder="请输入当前审批节点id" />
        </el-form-item>
        <el-form-item label="审核完成时间" prop="finishTime">
          <el-date-picker clearable
            v-model="form.finishTime"
            type="date"
            value-format="yyyy-MM-dd"
            placeholder="请选择审核完成时间">
          </el-date-picker>
        </el-form-item>
      </el-form>
      <div slot="footer" class="dialog-footer">
        <el-button type="primary" @click="submitForm">确 定</el-button>
        <el-button @click="cancel">取 消</el-button>
      </div>
    </el-dialog>
  </div>
</template>

<script>
import { listInstance, getInstance, delInstance, addInstance, updateInstance } from "@/api/system/instance"

export default {
  name: "Instance",
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
      // 审批实例表格数据
      instanceList: [],
      // 弹出层标题
      title: "",
      // 是否显示弹出层
      open: false,
      // 查询参数
      queryParams: {
        pageNum: 1,
        pageSize: 10,
        templateId: null,
        title: null,
        formData: null,
        status: null,
        urgency: null,
        promoterUserId: null,
        promoterLegalName: null,
        currentNodeId: null,
        finishTime: null,
      },
      // 表单参数
      form: {},
      // 表单校验
      rules: {
      }
    }
  },
  created() {
    this.getList()
  },
  methods: {
    /** 查询审批实例列表 */
    getList() {
      this.loading = true
      listInstance(this.queryParams).then(response => {
        this.instanceList = response.rows
        this.total = response.total
        this.loading = false
      })
    },
    // 取消按钮
    cancel() {
      this.open = false
      this.reset()
    },
    // 表单重置
    reset() {
      this.form = {
        id: null,
        templateId: null,
        title: null,
        formData: null,
        status: null,
        urgency: null,
        promoterUserId: null,
        promoterLegalName: null,
        currentNodeId: null,
        finishTime: null,
        createTime: null,
        updateTime: null
      }
      this.resetForm("form")
    },
    /** 搜索按钮操作 */
    handleQuery() {
      this.queryParams.pageNum = 1
      this.getList()
    },
    /** 重置按钮操作 */
    resetQuery() {
      this.resetForm("queryForm")
      this.handleQuery()
    },
    // 多选框选中数据
    handleSelectionChange(selection) {
      this.ids = selection.map(item => item.id)
      this.single = selection.length!==1
      this.multiple = !selection.length
    },
    /** 新增按钮操作 */
    handleAdd() {
      this.reset()
      this.open = true
      this.title = "添加审批实例"
    },
    /** 修改按钮操作 */
    handleUpdate(row) {
      this.reset()
      const id = row.id || this.ids
      getInstance(id).then(response => {
        this.form = response.data
        this.open = true
        this.title = "修改审批实例"
      })
    },
    /** 提交按钮 */
    submitForm() {
      this.$refs["form"].validate(valid => {
        if (valid) {
          if (this.form.id != null) {
            updateInstance(this.form).then(response => {
              this.$modal.msgSuccess("修改成功")
              this.open = false
              this.getList()
            })
          } else {
            addInstance(this.form).then(response => {
              this.$modal.msgSuccess("新增成功")
              this.open = false
              this.getList()
            })
          }
        }
      })
    },
    /** 删除按钮操作 */
    handleDelete(row) {
      const ids = row.id || this.ids
      this.$modal.confirm('是否确认删除审批实例编号为"' + ids + '"的数据项？').then(function() {
        return delInstance(ids)
      }).then(() => {
        this.getList()
        this.$modal.msgSuccess("删除成功")
      }).catch(() => {})
    },
    /** 导出按钮操作 */
    handleExport() {
      this.download('system/instance/export', {
        ...this.queryParams
      }, `instance_${new Date().getTime()}.xlsx`)
    }
  }
}
</script>
