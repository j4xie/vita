<template>
  <div class="app-container">
    <el-form :model="queryParams" ref="queryForm" size="small" :inline="true" v-show="showSearch" label-width="68px">
      <el-form-item label="权益名称" prop="equName">
        <el-input
          v-model="queryParams.equName"
          placeholder="请输入权益名称"
          clearable
          @keyup.enter.native="handleQuery"
        />
      </el-form-item>
      <el-form-item label="权益标识" prop="equTag">
        <el-input
          v-model="queryParams.equTag"
          placeholder="请输入权益标识"
          clearable
          @keyup.enter.native="handleQuery"
        />
      </el-form-item>
      <el-form-item label="排序" prop="equSort">
        <el-input
          v-model="queryParams.equSort"
          placeholder="请输入排序"
          clearable
          @keyup.enter.native="handleQuery"
        />
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
          v-hasPermi="['system:equData:add']"
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
          v-hasPermi="['system:equData:edit']"
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
          v-hasPermi="['system:equData:remove']"
        >删除</el-button>
      </el-col>
      <el-col :span="1.5">
        <el-button
          type="warning"
          plain
          icon="el-icon-download"
          size="mini"
          @click="handleExport"
          v-hasPermi="['system:equData:export']"
        >导出</el-button>
      </el-col>
      <right-toolbar :showSearch.sync="showSearch" @queryTable="getList"></right-toolbar>
    </el-row>

    <el-table v-loading="loading" :data="dataList" @selection-change="handleSelectionChange">
      <el-table-column type="selection" width="55" align="center" />
      <el-table-column label="序号" align="center" width="80" prop="id" />
      <el-table-column label="权益名称" align="center" prop="equName" />
      <el-table-column label="权益标识" align="center" width="220" prop="equTag" />
      <el-table-column label="状态" align="center" width="80" prop="equStatus" >
        <template slot-scope="scope">
          <span v-if="scope.row.equStatus == 1"><el-tag type="success">启用</el-tag></span>
          <span v-else-if="scope.row.equStatus == -1"><el-tag type="danger">停用</el-tag></span>
        </template>
      </el-table-column>
      <el-table-column label="排序" align="center" width="80" prop="equSort" />
      <el-table-column label="操作" align="center" width="200" class-name="small-padding fixed-width" fixed="right">
        <template slot-scope="scope">
          <el-button
            size="mini"
            type="text"
            icon="el-icon-edit"
            @click="handleUpdate(scope.row)"
            v-hasPermi="['system:equData:edit']"
          >修改</el-button>
          <el-button
            size="mini"
            type="text"
            icon="el-icon-delete"
            @click="handleDelete(scope.row)"
            v-hasPermi="['system:equData:remove']"
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

    <!-- 添加或修改核心权益管理对话框 -->
    <el-dialog :title="title" :visible.sync="open" width="500px" append-to-body>
      <el-form ref="form" :model="form" :rules="rules" label-width="80px">
        <el-form-item label="权益名称" prop="equName">
          <el-input v-model="form.equName" placeholder="请输入权益名称" maxlength="100"/>
        </el-form-item>
        <el-form-item label="权益标识" prop="equTag">
          <el-input v-model="form.equTag" placeholder="请输入权益标识" maxlength="14"/>
        </el-form-item>
        <el-form-item label="状态">
          <el-radio-group v-model="form.equStatus">
            <el-radio :key="1" :label="1">启用</el-radio>
            <el-radio :key="-1" :label="-1">停用</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="显示排序" prop="equSort">
          <el-input-number v-model="form.equSort" controls-position="right" :min="0" />
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
import { listData, getData, delData, addData, updateData } from "@/api/system/equ_data"

export default {
  name: "Data",
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
      // 核心权益管理表格数据
      dataList: [],
      // 弹出层标题
      title: "",
      // 是否显示弹出层
      open: false,
      // 查询参数
      queryParams: {
        pageNum: 1,
        pageSize: 10,
        equName: null,
        equTag: null,
        equStatus: null,
        equSort: null,
      },
      // 表单参数
      form: {},
      // 表单校验
      rules: {
        equName: [
          { required: true, message: "请输入权益名称", trigger: "blur" }
        ],
        equTag: [
          { required: true, message: "请输入权益标识", trigger: "blur" }
        ],
        equSort: [
          { required: true, message: "请输入排序", trigger: "blur" }
        ],
      }
    }
  },
  created() {
    this.getList()
  },
  methods: {
    /** 查询核心权益管理列表 */
    getList() {
      this.loading = true
      listData(this.queryParams).then(response => {
        this.dataList = response.rows
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
        equName: null,
        equTag: null,
        equStatus: 1,
        equSort: null,
        createTime: null,
        updateTime: null,
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
      this.title = "添加权益"
    },
    /** 修改按钮操作 */
    handleUpdate(row) {
      this.reset()
      const id = row.id || this.ids
      getData(id).then(response => {
        this.form = response.data
        this.open = true
        this.title = "修改权益"
      })
    },
    /** 提交按钮 */
    submitForm() {
      this.$refs["form"].validate(valid => {
        console.log(this.form)
        if (valid) {
          if (this.form.id != null) {
            updateData(this.form).then(response => {
              this.$modal.msgSuccess("修改成功")
              this.open = false
              this.getList()
            })
          } else {
            addData(this.form).then(response => {
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
      this.$modal.confirm('是否确认删除权益序号为"' + ids + '"的数据项？').then(function() {
        return delData(ids)
      }).then(() => {
        this.getList()
        this.$modal.msgSuccess("删除成功")
      }).catch(() => {})
    },
    /** 导出按钮操作 */
    handleExport() {
      this.download('system/equData/export', {
        ...this.queryParams
      }, `data_${new Date().getTime()}.xlsx`)
    }
  }
}
</script>
