<template>
  <div class="app-container">
    <el-divider content-position="left">金额积分比例设置</el-divider>
    <div class="set-item-div">
      <el-form ref="form" :model="form" :rules="rules" label-width="110px" style="width: 420px;">
        <el-form-item label="金额积分比例：" prop="pointAmountRate">
          <el-input v-model="pointAmountRate" placeholder="" style="width: 250px;" class="center-input" maxlength="6">
            <template slot="prepend">1美元 ≈ </template>
            <template slot="append">积分</template>  
          </el-input>
        </el-form-item>
      </el-form>
      <el-button type="primary" style="height: 36px;" @click="submitForm(1)">保存</el-button>
    </div>

  </div>
</template>

<script>
import { listData, getData, delData, addData, updateData } from "@/api/system/data"

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
      // 平台设置表格数据
      dataList: [],
      // 弹出层标题
      title: "",
      // 是否显示弹出层
      open: false,
      // 查询参数
      queryParams: {
        /* pageNum: 1,
        pageSize: 10, */
        dataKey: null,
        dataValue: null,
        dataDesc: null,
      },
      // 表单参数
      form: {},
      // 表单校验
      rules: {
      },
      pointAmountRate: ''
    }
  },
  created() {
    this.getList()
  },
  methods: {
    /** 查询平台设置列表 */
    getList() {
      this.loading = true
      listData(this.queryParams).then(response => {
        this.dataList = response.rows
        this.total = response.total
        this.loading = false
        console.log(this.dataList);
        for(var i = 0;i < this.dataList.length; i++){
          if(this.dataList[i].dataKey == "AMOUNT_POINTS_RATIO"){
            this.pointAmountRate = this.dataList[i].dataValue
          }
        }
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
        dataKey: null,
        dataValue: null,
        dataDesc: null,
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
      this.title = "添加平台设置"
    },
    /** 修改按钮操作 */
    handleUpdate(row) {
      this.reset()
      const id = row.id || this.ids
      getData(id).then(response => {
        this.form = response.data
        this.open = true
        this.title = "修改平台设置"
      })
    },
    /** 提交按钮 */
    submitForm(_flag) {
      if(_flag == 1){
        //保存金额积分比例
        this.form = {}
        for(var i = 0;i < this.dataList.length; i++){
          if(this.dataList[i].dataKey == "AMOUNT_POINTS_RATIO"){
            this.form.id = this.dataList[i].id
            this.form.dataValue = this.pointAmountRate
          }
        }
      }
      this.$refs["form"].validate(valid => {
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
      this.$modal.confirm('是否确认删除平台设置编号为"' + ids + '"的数据项？').then(function() {
        return delData(ids)
      }).then(() => {
        this.getList()
        this.$modal.msgSuccess("删除成功")
      }).catch(() => {})
    },
    /** 导出按钮操作 */
    handleExport() {
      this.download('system/data/export', {
        ...this.queryParams
      }, `data_${new Date().getTime()}.xlsx`)
    }
  }
}
</script>
<style scoped>
::v-deep .center-input .el-input__inner {
  text-align: center;
}
.set-item-div{
  display: flex;
  flex-direction: row;
}
</style>
