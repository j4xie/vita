<template>
  <div class="app-container">
    <el-form :model="queryParams" ref="queryForm" size="small" :inline="true" v-show="showSearch" label-width="68px">
      <el-form-item label="姓名" prop="userId">
        <el-input
          v-model="queryParams.legalName"
          placeholder="请输入姓名"
          clearable
          @keyup.enter.native="handleQuery"
        />
      </el-form-item>
      <el-form-item label="签到状态" prop="type">
        <el-select v-model="queryParams.type" placeholder="签到状态" clearable style="width: 240px">
          <el-option :key="1" label="已签到" :value="1" />
          <el-option :key="2" label="已签退" value="2" />
        </el-select>
      </el-form-item>
      <el-form-item label="状态" prop="status">
        <el-select v-model="queryParams.status" placeholder="状态" clearable style="width: 240px">
          <el-option :key="-1" label="待审核" :value="-1" />
          <el-option :key="1" label="审核通过" value="1" />
          <el-option :key="2" label="审核拒绝" value="2" />
        </el-select>
      </el-form-item>
      <el-form-item>
        <el-button type="primary" icon="el-icon-search" size="mini" @click="handleQuery">搜索</el-button>
        <el-button icon="el-icon-refresh" size="mini" @click="resetQuery">重置</el-button>
      </el-form-item>
    </el-form>

    <el-row :gutter="10" class="mb8">
      <!-- <el-col :span="1.5">
        <el-button
          type="primary"
          plain
          icon="el-icon-plus"
          size="mini"
          @click="handleAdd"
          v-hasPermi="['system:record:add']"
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
          v-hasPermi="['system:record:edit']"
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
          v-hasPermi="['system:record:remove']"
        >删除</el-button>
      </el-col>
      <el-col :span="1.5">
        <el-button
          type="warning"
          plain
          icon="el-icon-download"
          size="mini"
          @click="handleExport"
          v-hasPermi="['system:record:export']"
        >导出</el-button>
      </el-col> -->
      <right-toolbar :showSearch.sync="showSearch" @queryTable="getList"></right-toolbar>
    </el-row>

    <el-table v-loading="loading" :data="recordList" @selection-change="handleSelectionChange">
      <el-table-column type="selection" width="55" align="center" />
      <el-table-column label="姓名" align="center" prop="legalName" />
      <el-table-column label="签到时间" align="center" prop="startTime" width="180">
        <template slot-scope="scope">
          <span>{{scope.row.startTime}}</span>
        </template>
      </el-table-column>
      <el-table-column label="签退时间" align="center" prop="endTime" width="180">
        <template slot-scope="scope">
          <span>{{ scope.row.endTime }}</span>
        </template>
      </el-table-column>
      <el-table-column label="签到状态" align="center" prop="type" >
        <template slot-scope="scope">
          <span v-if="scope.row.type == 1"><el-tag>已签到</el-tag></span>
          <span v-if="scope.row.type == 2"><el-tag type="danger">已签退</el-tag></span>
        </template>
      </el-table-column>
      <el-table-column label="状 态" align="center" prop="status" >
        <template slot-scope="scope">
          <span v-if="scope.row.status == -1"><el-tag type="success">待审核</el-tag></span>
          <span v-if="scope.row.status == 1"><el-tag>审核通过</el-tag></span>
          <span v-if="scope.row.status == 2"><el-tag type="danger">审核拒绝</el-tag></span>
        </template>
      </el-table-column>
      <el-table-column label="说明" align="center" prop="remark" />
      <el-table-column label="操作人" align="center" prop="operateLegalName" />
      <el-table-column label="操作" align="center" class-name="small-padding fixed-width">
        <template slot-scope="scope">
          <el-button
            size="mini"
            type="text"
            icon="el-icon-edit"
            @click="handleUpdate(scope.row)"
            v-hasPermi="['system:record:edit']"
            v-if="scope.row.status == -1"
          >审核</el-button>
          <!-- <el-button
            size="mini"
            type="text"
            icon="el-icon-edit"
            @click="handleUpdate(scope.row)"
            v-hasPermi="['system:record:edit']"
          >修改</el-button>
          <el-button
            size="mini"
            type="text"
            icon="el-icon-delete"
            @click="handleDelete(scope.row)"
            v-hasPermi="['system:record:remove']"
          >删除</el-button> -->
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

    <!-- 添加或修改志愿者打卡记录对话框 -->
    <el-dialog :title="title" :visible.sync="open" width="500px" append-to-body>
      <el-form ref="form" :model="form" :rules="rules" label-width="80px">
        <el-form-item label="签到时间" prop="startTime">
          <el-date-picker clearable
            v-model="form.startTime"
            type="datetime"
            placeholder="请选择签到时间"
            format="yyyy-MM-dd HH:mm:ss"
            value-format="yyyy-MM-dd HH:mm:ss">
          </el-date-picker>
        </el-form-item>
        <el-form-item label="签退时间" prop="endTime">
          <el-date-picker clearable
            v-model="form.endTime"
            type="datetime"
            placeholder="请选择签退时间"
            format="yyyy-MM-dd HH:mm:ss"
            value-format="yyyy-MM-dd HH:mm:ss">
          </el-date-picker>
        </el-form-item>
        <el-row >
          <el-form-item label="审核状态" prop="">
            <el-radio-group v-model="form.status">
              <el-radio :label="1">审核通过</el-radio>
              <el-radio :label="2">审核拒绝</el-radio>
            </el-radio-group>
          </el-form-item>
        </el-row>
        <el-row >
          <el-form-item label="拒绝原因" prop="" v-if="form.status == 2">
            <el-input v-model="form.reason" type="textarea" placeholder="请输入拒绝原因" maxlength="200"/>
          </el-form-item>
        </el-row>
      </el-form>
      <div slot="footer" class="dialog-footer">
        <el-button type="primary" @click="submitForm">确 定</el-button>
        <el-button @click="cancel">取 消</el-button>
      </div>
    </el-dialog>
  </div>
</template>

<script>
import { listRecord, getRecord, delRecord, addRecord, updateRecord, auditRecord } from "@/api/system/record"

export default {
  name: "Record",
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
      // 志愿者打卡记录表格数据
      recordList: [],
      // 弹出层标题
      title: "",
      // 是否显示弹出层
      open: false,
      // 查询参数
      queryParams: {
        pageNum: 1,
        pageSize: 10,
        userId: null,
        startTime: null,
        endTime: null,
        type: null,
        operateUserId: null,
        operateLegalName: null
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
    /** 查询志愿者打卡记录列表 */
    getList() {
      this.loading = true
      listRecord(this.queryParams).then(response => {
        this.recordList = response.rows
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
        userId: null,
        startTime: null,
        endTime: null,
        type: null,
        operateUserId: null,
        operateLegalName: null,
        status: 1
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
      this.title = "添加志愿者打卡记录"
    },
    /** 修改按钮操作 */
    handleUpdate(row) {
      this.reset()
      const id = row.id || this.ids
      getRecord(id).then(response => {
        this.form = response.data
        this.form.status = 1
        this.open = true
        this.title = "修改志愿者打卡记录"
      })
    },
    /** 提交按钮 */
    submitForm() {
      this.$refs["form"].validate(valid => {
        if (valid) {
          if (this.form.id != null) {

            var _data = {
              id: this.form.id,
              userId: this.form.userId,
              startTime: this.form.startTime,
              endTime: this.form.endTime,
              status: this.form.status,
              type: 2
            }
            if(this.form.status == 2){
              _data.remark = this.form.remark ? this.form.remark + " 拒绝原因：" + this.form.reason : " 拒绝原因：" + this.form.reason
            }

            auditRecord(_data).then(response => {
              this.$modal.msgSuccess("操作成功")
              this.open = false
              this.getList()
            })
            /* updateRecord(_data).then(response => {
              this.$modal.msgSuccess("修改成功")
              this.open = false
              this.getList()
            }) */
          } else {
            addRecord(this.form).then(response => {
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
      this.$modal.confirm('是否确认删除志愿者打卡记录编号为"' + ids + '"的数据项？').then(function() {
        return delRecord(ids)
      }).then(() => {
        this.getList()
        this.$modal.msgSuccess("删除成功")
      }).catch(() => {})
    },
    /** 导出按钮操作 */
    handleExport() {
      this.download('system/record/export', {
        ...this.queryParams
      }, `record_${new Date().getTime()}.xlsx`)
    }
  }
}
</script>
