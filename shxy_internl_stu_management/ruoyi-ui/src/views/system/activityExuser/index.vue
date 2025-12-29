<template>
  <div class="app-container">
    <h4 class="form-header h4">活动信息</h4>
    <el-form ref="form" :model="form" label-width="80px">
      <el-row>
        <el-col>
          <el-form-item label="活动名称" prop="userName">
            <span style="font-weight: bold; font-size: 20px;">{{form.name}}</span>
          </el-form-item>
        </el-col>
      </el-row>
    </el-form>

    <h4 class="form-header h4">报名信息</h4>
    <el-table v-loading="loading" :row-key="getRowKey" @row-click="clickRow" ref="table" @selection-change="handleSelectionChange" :data="roles.slice((pageNum-1)*pageSize,pageNum*pageSize)">
      <el-table-column label="序号" type="index" align="center">
        <template slot-scope="scope">
          <span>{{ (pageNum - 1) * pageSize + scope.$index + 1 }}</span>
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
            v-hasPermi="['system:activity:edit']"
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

export default {
  name: "AuthRole",
  data() {
    return {
      open: false,
      dataInfo: [],
      // 遮罩层
      loading: true,
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
      const userId = this.form.userId
      const roleIds = this.roleIds.join(",")
      updateAuthRole({ userId: userId, roleIds: roleIds }).then((response) => {
        this.$modal.msgSuccess("授权成功")
        this.close()
      })
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
    }
  }
}
</script>