<template>
  <div class="app-container">
    <el-form :model="queryParams" ref="queryForm" size="small" :inline="true" v-show="showSearch" label-width="68px">
      <el-form-item label="等级名称" prop="levelName">
        <el-input
          v-model="queryParams.levelName"
          placeholder="请输入等级名称"
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
          v-hasPermi="['system:level:add']"
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
          v-hasPermi="['system:level:edit']"
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
          v-hasPermi="['system:level:remove']"
        >删除</el-button>
      </el-col>
      <el-col :span="1.5">
        <el-button
          type="warning"
          plain
          icon="el-icon-download"
          size="mini"
          @click="handleExport"
          v-hasPermi="['system:level:export']"
        >导出</el-button>
      </el-col>
      <right-toolbar :showSearch.sync="showSearch" @queryTable="getList"></right-toolbar>
    </el-row>

    <el-table v-loading="loading" :data="levelList" @selection-change="handleSelectionChange">
      <el-table-column type="selection" width="55" align="center" />
      <el-table-column label="会员等级" align="center" prop="levelName" />
      <el-table-column label="会员卡" align="center" prop="logo" >
        <template slot-scope="scope">
          <img :src="scope.row.logo" style="height: 80px;"/>
        </template>
      </el-table-column>
      <el-table-column label="会员权益" align="center" width="500" prop="memberBenefits">
        <template slot-scope="scope">
          <div v-for="item in scope.row.userLevelExEquityList" :key="item.equityId">
            <span>{{item.equName}}</span>
          </div>
        </template>
      </el-table-column>
      <el-table-column label="是否可自动升级" align="center" prop="isUpgrade">
        <template slot-scope="scope">
          <span v-if="scope.row.isUpgrade == 1">是</span>
          <span v-else>否</span>
        </template>
      </el-table-column>
      <el-table-column label="积分倍数" align="center" prop="pointRate">
        <template slot-scope="scope">
          <span>x{{scope.row.pointRate}}</span>
        </template>
      </el-table-column>
      <el-table-column label="获取资格" align="center" prop="acquisitionMethod" />
      <el-table-column label="创建者" align="center" prop="createByName" />
      <el-table-column label="更新人" align="center" prop="updateByName" width="180"/>
      <el-table-column label="操作" fixed="right" align="center" class-name="small-padding fixed-width" width="180">
        <template slot-scope="scope">
          <el-button
            size="mini"
            type="text"
            icon="el-icon-edit"
            @click="handleUpdate(scope.row)"
            v-hasPermi="['system:level:edit']"
          >修改</el-button>
          <el-button
            size="mini"
            type="text"
            icon="el-icon-delete"
            @click="handleDelete(scope.row)"
            v-hasPermi="['system:level:remove']"
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

    <!-- 添加或修改会员等级对话框 -->
    <el-dialog :title="title" :visible.sync="open" width="600px" append-to-body>
      <el-form ref="form" :model="form" :rules="rules" label-width="100px">
        <el-form-item label="会员卡图" prop="logo">
          <BigFileUpload 
            @handleUploadSuccess="handleUploadSuccess"
            :defaultUrl = "form.logo"
            :imgWidth="180"
            :imgHeight="118"
          />
        </el-form-item>
        <el-form-item label="等级名称" prop="levelName">
          <el-input v-model="form.levelName" placeholder="请输入等级名称" />
        </el-form-item>
        <el-form-item label="会员权益" prop="memberBenefits">
          <el-select v-model="form.equids" multiple placeholder="请选择" style="width: 100%;">
            <el-option
              v-for="item in equList"
              :key="item.id"
              :label="item.equName"
              :value="item.id">
            </el-option>
          </el-select>
          <!-- <el-input v-model="form.memberBenefits" type="textarea" placeholder="请输入内容"/> -->
        </el-form-item>
        <el-form-item label="是否自动升级" prop="isUpgrade">
          <el-radio-group v-model="form.isUpgrade">
            <el-radio :key="1" :label="1">是</el-radio>
            <el-radio :key="-1" :label="-1">否</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="门槛类型" prop="limitType" v-if="form.isUpgrade == 1">
          <el-radio-group v-model="form.limitType">
            <el-radio :key="1" :label="1">积分</el-radio>
            <el-radio :key="2" :label="2">消费</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="升级门槛" prop="limitValue" v-if="form.isUpgrade == 1">
          <el-input v-model="form.limitValue" placeholder="请输入升级门槛" />
        </el-form-item>
        <el-form-item label="积分倍数" prop="pointRate">
          <el-input v-model="form.pointRate" placeholder="请输入消费获取积分倍数" />
        </el-form-item>
        <el-form-item label="获取资格" prop="acquisitionMethodType">
          <el-select v-model="form.acquisitionMethodType" clearable placeholder="请选择">
            <el-option :key="'register_get'" :label="'注册即得'" :value="'register_get'"></el-option>
            <el-option :key="'verify_email_get'" :label="'认证邮箱即得'" :value="'verify_email_get'"></el-option>
            <el-option :key="'buy_get'" :label="'购买获得'" :value="'buy_get'"></el-option>
          </el-select>
        </el-form-item>
        <el-form-item label="有效期类型" prop="periodOfValidityType" v-if="form.acquisitionMethodType == 'buy_get'">
          <el-radio-group v-model="form.periodOfValidityType" @change="periodOfValidityTypeChange">
            <el-radio :key="1" :label="1">固定日期</el-radio>
            <el-radio :key="2" :label="2">领取之后</el-radio>
            <el-radio :key="3" :label="3">永久</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="固定日期" v-if="form.acquisitionMethodType == 'buy_get' && form.periodOfValidityType == 1">
          <el-date-picker
            v-model="form.validityDate"
            type="daterange"
            range-separator="至"
            start-placeholder="开始日期"
            end-placeholder="结束日期">
          </el-date-picker>
        </el-form-item>
        <el-form-item label="领取后" v-if="form.acquisitionMethodType == 'buy_get' && form.periodOfValidityType == 2">
          <el-input-number v-model="form.validityNum" @change="handleChange" :min="1" :max="400" label="描述文字" style="width: 150px;"></el-input-number>
          <el-select v-model="form.validityType" placeholder="请选择" style="width: 80px; margin-left: 20px;">
            <el-option :key="1" label="天" :value="1"></el-option>
            <el-option :key="2" label="月" :value="2"></el-option>
            <el-option :key="3" label="年" :value="3"></el-option>
          </el-select>
          内有效
        </el-form-item>
        <el-form-item label="说明获取资格" prop="acquisitionMethod" v-if="form.acquisitionMethodType == -1">
          <el-input v-model="form.acquisitionMethod" type="textarea" placeholder="请输入获取资格"/>
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
import { listLevel, getLevel, delLevel, addLevel, updateLevel } from "@/api/system/level"
import { listData } from "@/api/system/equ_data"
import BigFileUpload from '../../../components/BigFileUpload/index.vue'

export default {
  name: "Level",
  components:{
    BigFileUpload,
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
      // 会员等级表格数据
      levelList: [],
      equList: [],
      // 弹出层标题
      title: "",
      // 是否显示弹出层
      open: false,
      // 查询参数
      queryParams: {
        pageNum: 1,
        pageSize: 10,
        levelName: null,
        memberBenefits: null,
        isUpgrade: null,
        limitValue: null,
        limitType: null,
        pointRate: null,
        createByUserId: null,
        createByName: null,
        updateByName: null,
      },
      // 表单参数
      form: {},
      // 表单校验
      rules: {
        levelName: [
          { required: true, message: "等级名称不能为空", trigger: "blur" },
        ],
        /* memberBenefits: [
          { required: true, message: "会员权益不能为空", trigger: "blur" },
        ], */
        limitValue: [
          { required: true, message: "升级门槛不能为空", trigger: "blur" },
          { pattern: /^([0-9][0-9]*)+(.[0-9]{1,2})?$/, message: "升级门槛只能为大于等于0的数字", trigger: "blur" }
        ],
        pointRate: [
          { required: true, message: "积分倍数不能为空", trigger: "blur" },
          { pattern: /^([0-9][0-9]*)+(.[0-9]{1,2})?$/, message: "积分倍数只能为大于等于0的数字", trigger: "blur" }
        ],
        password: [
          { required: true, message: "用户密码不能为空", trigger: "blur" },
          { min: 5, max: 20, message: '用户密码长度必须介于 5 和 20 之间', trigger: 'blur' },
          { pattern: /^[^<>"'|\\]+$/, message: "不能包含非法字符：< > \" ' \\\ |", trigger: "blur" }
        ],
        acquisitionMethodType: [
          { required: true, message: "请选择获取方式", trigger: "blur" },
        ],
        periodOfValidityType: [
          { required: true, message: "请选择有效期类型", trigger: "blur" },
        ],
        validityDate: [
          { required: true, message: "请选择固定有效期", trigger: "blur" },
        ],
        validityNum: [
          { required: true, message: "请选择有效时长", trigger: "blur" },
        ]
      }
    }
  },
  created() {
    this.getList()
    this.getEquList();
  },
  methods: {
    /** 查询会员等级列表 */
    getList() {
      this.loading = true
      listLevel(this.queryParams).then(response => {
        this.levelList = response.rows
        this.total = response.total
        this.loading = false
      })
    },
    /** 查询核心权益列表 */
    getEquList() {
      listData({}).then(response => {
        this.equList = response.rows
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
        levelName: null,
        memberBenefits: null,
        equids: [],
        isUpgrade: -1,
        limitValue: null,
        limitType: 1,
        pointRate: null,
        createTime: null,
        createByUserId: null,
        createByName: null,
        updateTime: null,
        updateByName: null,
        periodOfValidityType: 1,
        validityNum: 1,
        validityType: 1
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
      this.title = "添加会员等级"
    },
    /** 修改按钮操作 */
    handleUpdate(row) {
      this.reset()
      const id = row.id || this.ids
      getLevel(id).then(response => {
        this.form = response.data
        this.open = true
        this.title = "修改会员等级"
        if(!this.form.periodOfValidityType || this.form.periodOfValidityType < 0){
          this.$set(this.form, 'periodOfValidityType', 1)
        }
        if(!this.form.validityNum || this.form.validityNum < 0){
          this.$set(this.form, 'validityNum', 1)
        }
        if(!this.form.validityType || this.form.validityType < 0){
          this.$set(this.form, 'validityType', 1)
        }
        if(this.form.validityStartTime && this.form.validityEndTime){
          this.$set(this.form, 'validityDate', [new Date(this.form.validityStartTime), new Date(this.form.validityEndTime)] )

        }
      })
    },
    /** 提交按钮 */
    submitForm() {
      this.$refs["form"].validate(valid => {
        if (valid) {

          if(this.form.acquisitionMethodType == "register_get"){
            this.form.acquisitionMethod = "注册即可获得"
          }else if(this.form.acquisitionMethodType == "verify_email_get"){
            this.form.acquisitionMethod = "认证邮箱即可获得"
          }else if(this.form.acquisitionMethodType == "buy_get"){
            this.form.acquisitionMethod = "购买获得"
          }

          if(this.form.validityDate != null && this.form.validityDate.length == 2){
            this.form.validityStartTime = this.form.validityDate[0]
            this.form.validityEndTime = this.form.validityDate[1]
            if(this.form.validityEndTime){
              console.log(this.form.validityEndTime.toLocaleString());
              var _str = this.form.validityEndTime.toLocaleString().substring(0,10) + " 23:59:59"
              this.form.validityEndTime = new Date(_str)
            }
          }

          if(this.form.acquisitionMethodType == 'buy_get'){
            if(this.form.periodOfValidityType == 1){
              this.form.validityNum = -10
              this.form.validityType = -10
            }else if(this.form.periodOfValidityType == 2){
              this.form.validityStartTime = null
              this.form.validityEndTime = null
            }else if(this.form.periodOfValidityType == 3){
              this.form.validityStartTime = null
              this.form.validityEndTime = null
              this.form.validityNum = -10
              this.form.validityType = -10
            }
          }else{
            this.form.periodOfValidityType = -10
            this.form.validityStartTime = null
            this.form.validityEndTime = null
            this.form.validityNum = -10
            this.form.validityType = -10
          }

          if (this.form.id != null) {
            updateLevel(this.form).then(response => {
              this.$modal.msgSuccess("修改成功")
              this.open = false
              this.getList()
            })
          } else {
            addLevel(this.form).then(response => {
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
      this.$modal.confirm('是否确认删除会员等级编号为"' + ids + '"的数据项？').then(function() {
        return delLevel(ids)
      }).then(() => {
        this.getList()
        this.$modal.msgSuccess("删除成功")
      }).catch(() => {})
    },
    /** 导出按钮操作 */
    handleExport() {
      this.download('system/level/export', {
        ...this.queryParams
      }, `level_${new Date().getTime()}.xlsx`)
    },
    handleUploadSuccess(_url, _flag){
      console.log("图片上传回执")
      this.form.logo = _url
    },
    periodOfValidityTypeChange(value){
      console.log(value);
      if(value == 1){

      }else if(value == 2){

      }
    },
    handleChange(value) {
      console.log(value);
    }
  }
}
</script>
<style scoped>
::v-deep .el-textarea__inner{
  height: 120px;
}
</style>
