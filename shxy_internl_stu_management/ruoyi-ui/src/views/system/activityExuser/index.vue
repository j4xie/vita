<template>
  <div class="app-container">
    <h4 class="form-header h4">活动信息</h4>
    <el-form :model="queryParams" ref="queryForm" size="small" :inline="true" v-show="showSearch" label-width="68px">
      <el-form-item label="法定姓名" prop="legalName">
        <el-input
          v-model="queryParams.legalName"
          placeholder="请输入法定姓名"
          clearable
          @keyup.enter.native="handleQuery"
        />
      </el-form-item>
      <el-form-item label="英文名" prop="nickName">
        <el-input
          v-model="queryParams.nickName"
          placeholder="请输入英文名"
          clearable
          @keyup.enter.native="handleQuery"
        />
      </el-form-item>
      <el-form-item label="手机号" prop="phonenumber">
        <el-input
          v-model="queryParams.phonenumber"
          placeholder="请输入手机号"
          clearable
          @keyup.enter.native="handleQuery"
        />
      </el-form-item>
      <el-form-item>
        <el-button type="primary" icon="el-icon-search" size="mini" @click="handleQuery">搜索</el-button>
        <el-button icon="el-icon-refresh" size="mini" @click="resetQuery">重置</el-button>
      </el-form-item>
    </el-form>

    <!-- 活动信息表单 -->
    <el-form ref="form" :model="form" label-width="80px">
      <el-row>
        <el-col>
          <el-form-item label="活动名称" prop="userName">
            <span style="font-weight: bold; font-size: 20px;">{{form.name}}</span>
          </el-form-item>
        </el-col>
      </el-row>

      <el-row :gutter="10" class="mb8">
        <el-col :span="1.5">
          <el-button
            type="warning"
            plain
            icon="el-icon-download"
            size="mini"
            @click="handleExport"
          >导出</el-button>
        </el-col>
        <right-toolbar :showSearch.sync="showSearch" @queryTable="getList"></right-toolbar>
      </el-row>
    </el-form>

    <h4 class="form-header h4">报名信息</h4>
    <el-table v-loading="loading" :row-key="getRowKey" @row-click="clickRow" ref="table" @selection-change="handleSelectionChange" :data="roles">
      <el-table-column label="序号" type="index" align="center">
        <template slot-scope="scope">
          <span>{{ (queryParams.pageNum - 1) * queryParams.pageSize + scope.$index + 1 }}</span>
        </template>
      </el-table-column>
      <el-table-column type="selection" :reserve-selection="true" :selectable="checkSelectable" width="55" />
      <el-table-column label="法定姓名" align="center" prop="legalName" />
      <el-table-column label="英文名" align="center" prop="nickName" />
      <el-table-column label="手机号" align="center" prop="phonenumber" />
      <el-table-column label="邮箱" align="center" prop="email" />
      <el-table-column label="签到状态" align="center" prop="signStatus">
        <template slot-scope="scope">
          <span v-if="scope.row.signStatus == 1">已签到</span>
          <span v-else>未签到</span>
        </template>
      </el-table-column>
      <el-table-column label="报名时间" align="center" prop="createTime" width="180">
        <template slot-scope="scope">
          <span>{{ parseTime(scope.row.createTime) }}</span>
        </template>
      </el-table-column>
      <el-table-column label="操作" align="center" class-name="small-padding fixed-width">
        <template slot-scope="scope">
          <el-button
            size="mini"
            type="text"
            icon="el-icon-d-arrow-right"
            @click="showMoreInfo(scope.row)"
          >更多信息</el-button>
        </template>
      </el-table-column>
    </el-table>

    <!-- <pagination v-show="total>0" :total="total" :page.sync="pageNum" :limit.sync="pageSize" /> -->
      <pagination
        v-show="total>0"
        :total="total"
        :page.sync="queryParams.pageNum"
        :limit.sync="queryParams.pageSize"
        @pagination="getActSignList"
      />

    <!-- 底部按钮表单 -->
    <el-form label-width="100px">
      <el-form-item style="text-align: center;margin-left:-120px;margin-top:30px;">
        <!-- <el-button type="primary" @click="submitForm()">提交</el-button> -->
        <el-button @click="close()">返回</el-button>
      </el-form-item>
    </el-form>


    <!-- 添加或修改活动对话框 -->
    <el-dialog title="报名信息" :visible.sync="open" width="600px" append-to-body>
      <el-form ref="form" label-width="80px">
        <el-row v-for="(item, index) in dataInfo" :key="index">
          <el-form-item :label="item.label+'：'" prop="name">
            <div>{{ item.valueTxt }}</div>
          </el-form-item>
        </el-row>
        
      </el-form>
    </el-dialog>
  </div>
</template>

<script>
import { getActivity, actSignList } from "@/api/system/activity"
import { parseTime } from "@/utils/ruoyi"
import RightToolbar from "@/components/RightToolbar"

export default {
  components: {
    RightToolbar
  },
  name: "AuthRole",
  data() {
    return {
      open: false,
      dataInfo: [],
      // 遮罩层
      loading: true,
      // 显示搜索条件
      showSearch: true,
      // 分页信息
      total: 0,
      pageNum: 1,
      pageSize: 10,
      // 选中角色编号
      roleIds: [],
      // 角色信息
      roles: [],
      // 用户信息
      form: {},
      queryParams: {
        pageNum: 1,
        pageSize: 10,
      }
    }
  },
  created() {
    const activityId = this.$route.params && this.$route.params.activityId
    if (activityId) {
      getActivity(activityId).then((response) => {
        console.log(response)
        this.form = response.data
        this.loading = false
      })
      this.queryParams.activityId = activityId
      this.getActSignList();
    }
  },
  methods: {
    /** 搜索按钮操作 */
    handleQuery() {
      this.queryParams.pageNum = 1
      this.getList()
    },
    /** 重置按钮操作 */
    resetQuery() {
      this.$refs.queryForm.resetFields()
      this.handleQuery()
    },
    /** 查询活动列表 */
    getList() {
      this.getActSignList();
    },
    getActSignList(){
      this.loading = true
      actSignList(this.queryParams).then((response) => {
        console.log(response)
        this.roles = response.rows
        this.total = response.total
        this.$nextTick(() => {
          this.roles.forEach((row) => {
            if (row.flag) {
              this.$refs.table.toggleRowSelection(row)
            }
          })
        })
        this.loading = false
      })
    },
    /** 单击选中行数据 */
    clickRow(row) {
      if (this.checkSelectable(row)) {
        this.$refs.table.toggleRowSelection(row)
      }
    },
    // 多选框选中数据
    handleSelectionChange(selection) {
      this.roleIds = selection.map((item) => item.roleId)
    },
    // 保存选中的数据编号
    getRowKey(row) {
      return row.roleId
    },
    // 检查角色状态
    checkSelectable(row) {
      return row.status === "0" ? true : false
    },
    /** 提交按钮 */
    submitForm() {
      // 由于不需要提交功能，暂时注释掉
      /*const userId = this.form.userId
      const roleIds = this.roleIds.join(",")
      updateAuthRole({ userId: userId, roleIds: roleIds }).then((response) => {
        this.$modal.msgSuccess("授权成功")
        this.close()
      })
      */
    },
    /** 关闭按钮 */
    close() {
      this.$tab.closePage()
    },
    showMoreInfo(row){
      if(!row.modelFormInfo){
        this.$message.warning("暂无更多信息")
        return;
      }
      this.dataInfo = JSON.parse(row.modelFormInfo)
      this.open = true
    },
    /** 导出按钮操作 */
    handleExport() {
      this.download('system/activity/exportExUser', {
        ...this.queryParams
      }, `报名表_${new Date().getTime()}.xlsx`)
    },
  }
}
</script>