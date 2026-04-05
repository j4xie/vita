<template>
  <div class="app-container">
    <el-form :model="queryParams" ref="queryForm" size="small" :inline="true" v-show="showSearch" label-width="68px">
      <el-form-item label="券名称" prop="couponName">
        <el-input
          v-model="queryParams.couponName"
          placeholder="请输入券名称"
          clearable
          @keyup.enter.native="handleQuery"
        />
      </el-form-item>
      <el-form-item label="券码" prop="couponNo">
        <el-input
          v-model="queryParams.couponNo"
          placeholder="请输入券码"
          clearable
          @keyup.enter.native="handleQuery"
        />
      </el-form-item>
      <el-form-item label="来源" prop="sourceFrom">
        <el-select v-model="queryParams.sourceFrom" clearable placeholder="请选择来源">
          <el-option
            :key="1"
            :label="'商家'"
            :value="1">
          </el-option>
          <el-option
            :key="2"
            :label="'平台'"
            :value="2">
          </el-option>
        </el-select>
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
          v-hasPermi="['system:coupon:add']"
        >新增</el-button>
      </el-col>
      <!-- <el-col :span="1.5">
        <el-button
          type="success"
          plain
          icon="el-icon-edit"
          size="mini"
          :disabled="single"
          @click="handleUpdate"
          v-hasPermi="['system:coupon:edit']"
        >修改</el-button>
      </el-col> -->
      <!-- <el-col :span="1.5">
        <el-button
          type="danger"
          plain
          icon="el-icon-delete"
          size="mini"
          :disabled="multiple"
          @click="handleDelete"
          v-hasPermi="['system:coupon:remove']"
        >删除</el-button>
      </el-col> -->
      <el-col :span="1.5">
        <el-button
          type="warning"
          plain
          icon="el-icon-download"
          size="mini"
          @click="handleExport"
          v-hasPermi="['system:coupon:export']"
        >导出</el-button>
      </el-col>
      <right-toolbar :showSearch.sync="showSearch" @queryTable="getList"></right-toolbar>
    </el-row>

    <el-table v-loading="loading" :data="couponList" @selection-change="handleSelectionChange">
      <el-table-column type="selection" width="55" align="center" />
      <el-table-column label="序号" width="60" align="center" prop="id" />
      <el-table-column label="券码" width="200" align="center" prop="couponNo" />
      <el-table-column label="券名称" width="200" align="center" prop="couponName" />
      <el-table-column label="券类型" align="center" prop="couponType">
        <template slot-scope="scope">
          <span v-if="scope.row.couponType == 1">代金券</span>
          <span v-else></span>
        </template>
      </el-table-column>
      <el-table-column label="金额" align="center" prop="couponPrice" />
      <el-table-column label="使用门槛" align="center" prop="couponLimit">
        <template slot-scope="scope">
          <span v-if="scope.row.couponLimit == 0">无门槛</span>
          <span v-else>满{{scope.row.couponLimit}}可用</span>
        </template>
      </el-table-column>
      <el-table-column label="库存数量" align="center" prop="quantity" />
      <el-table-column label="有效期" align="center" prop="validFrom" width="180">
        <template slot-scope="scope">
          <div style="display: flex; flex-direction: column;">
            <span style="line-height: normal;">{{ scope.row.validFrom }}</span>
            <span style="line-height: normal;">~</span>
            <span style="line-height: normal;">{{ scope.row.validEnd}}</span>
          </div> 
        </template>
      </el-table-column>
      <el-table-column label="状态" align="center" prop="status" width="80">
        <template slot-scope="scope">
          <span v-if="scope.row.status == -1"><el-tag type="success">待审核</el-tag></span>
          <span v-if="scope.row.status == 1"><el-tag>审核通过</el-tag></span>
          <span v-if="scope.row.status == 2">
            <el-tag type="danger">审核拒绝</el-tag>
            <!-- <el-tooltip :content="scope.row.remark" placement="top"><span style="color: #ff0000">审核拒绝</span></el-tooltip> -->
          </span>
          <span v-if="scope.row.status == 3"><el-tag type="warning">已过期</el-tag></span>
        </template>
      </el-table-column>
      <el-table-column label="适用门店" align="center" prop="purpose" width="180">
        <template slot-scope="scope">
          <span v-if="scope.row.purpose == 1">全部门店</span>
          <span v-if="scope.row.purpose == 2">{{scope.row.purposeMerchantName}}</span>
        </template>
      </el-table-column>
      <el-table-column label="来源" align="center" prop="sourceFrom" width="80">
        <template slot-scope="scope">
          <span v-if="scope.row.sourceFrom == 1">商家</span>
          <span v-else>平台</span>
        </template>
      </el-table-column>
      <el-table-column label="创建人" align="center" prop="createByName" />
      <el-table-column label="操作" fixed="right" align="center" width="180" class-name="small-padding fixed-width" >
        <template slot-scope="scope" >
          <span v-hasPermi="['system:role:merchant']">
            <el-button
              size="mini"
              type="text"
              icon="el-icon-edit"
              @click="handleUpdate(scope.row)"
              v-if="scope.row.status == 2"
            >修改</el-button>
            <el-button
              size="mini"
              type="text"
              icon="el-icon-delete"
              @click="handleDelete(scope.row)"
            >删除</el-button>
          </span>

          <span v-hasPermi="['system:role:manage', 'system:role:part_manage']">
            <el-button
              size="mini"
              type="text"
              icon="el-icon-edit"
              @click="handleUpdate(scope.row)"
              v-hasPermi="['system:coupon:edit', 'system:role:manage']"
              v-if="scope.row.sourceFrom != 1"
            >修改</el-button>
            <el-button
              size="mini"
              type="text"
              icon="el-icon-edit"
              @click="handleAudit(scope.row)"
              v-hasPermi="['system:coupon:audit', 'system:role:manage']"
              v-if="scope.row.status == -1"
            >审核</el-button>
            <el-button
              size="mini"
              type="text"
              icon="el-icon-edit"
              @click="handleIssueCoupons(scope.row)"
              v-hasPermi="['system:coupon:audit', 'system:role:manage']"
              v-if="scope.row.status == 1"
            >发放券</el-button>
            <el-button
              size="mini"
              type="text"
              icon="el-icon-delete"
              @click="handleDelete(scope.row)"
              v-hasPermi="['system:coupon:remove']"
            >删除</el-button>
          </span>
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

    <!-- 添加或修改优惠券对话框 -->
    <el-dialog :title="title" :visible.sync="open" width="600px" append-to-body>
      <el-form ref="form" :model="form" :rules="rules" label-width="100px">
        <el-form-item label="券名称" prop="couponName">
          <el-input v-model="form.couponName" placeholder="请输入券名称" :disabled="isAudit"/>
        </el-form-item>
        <el-form-item label="券类型" prop="couponType">
          <el-select v-model="form.couponType" clearable placeholder="请选择券类型" :disabled="isAudit">
            <el-option
              :key="1"
              :label="'代金券'"
              :value="1">
            </el-option>
          </el-select>
        </el-form-item>
        <el-form-item label="创建方式" prop="method" v-if="form.id == undefined">
          <el-radio-group v-model="form.method">
            <el-radio :label="-1">批量券</el-radio>
            <el-radio :label="1">指定券码</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="券码" prop="couponNo" v-if="form.method == 1">
          <el-input v-model="form.couponNo" placeholder="请输入券码" :disabled="isAudit"/>
        </el-form-item>
        <el-form-item label="库存数量" prop="quantity" v-if="form.method == -1">
          <el-input v-model="form.quantity" placeholder="请输入库存数量" :disabled="isAudit" maxlength="5"/>
        </el-form-item>
        <el-form-item label="金额" prop="couponPrice">
          <el-input v-model="form.couponPrice" placeholder="请输入金额" :disabled="isAudit"/>
        </el-form-item>
        <el-form-item label="使用门槛" prop="couponLimit">
          <el-input v-model="form.couponLimit" placeholder="请输入使用门槛" :disabled="isAudit"/>
        </el-form-item>
        <el-form-item label="有效时间" prop="validTime" >
          <el-date-picker
            :disabled="isAudit"
            v-model="form.validTime"
            type="datetimerange"
            range-separator="至"
            start-placeholder="开始日期"
            end-placeholder="结束日期"
            format="yyyy-MM-dd HH:mm:ss"
            value-format="yyyy-MM-dd HH:mm:ss">
          </el-date-picker>
        </el-form-item>
        <el-form-item label="适用范围" prop="purpose" v-if="!isAudit" v-hasPermi="['system:role:manage', 'system:role:part_manage']">
          <el-radio-group v-model="form.purpose">
            <el-radio :label="1">全部门店</el-radio>
            <el-radio :label="2">指定门店</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="适用门店" prop="purpose" v-if="isAudit" v-hasPermi="['system:role:manage', 'system:role:part_manage']">
          <span v-if="form.purpose == 1">全部门店</span>
          <span v-else-if="form.purpose == 2">{{form.purposeMerchantName}}</span>
        </el-form-item>
        <el-form-item label="可用门店" prop="purposeMerchantUserId" v-if="form.purpose == 2 & !isAudit" v-hasPermi="['system:role:manage', 'system:role:part_manage']">
          <el-select v-model="form.purposeMerchantUserId" multiple placeholder="请选择">
            <el-option
              v-for="item in merchantList"
              :key="item.userId"
              :label="item.merchantName"
              :value="item.userId">
            </el-option>
          </el-select>
        </el-form-item>
        <el-form-item label="使用规则" prop="couponRules">
          <el-input v-model="form.couponRules" type="textarea" placeholder="请输入使用规则" maxlength="200" :disabled="isAudit"/>
        </el-form-item>
        <el-row v-if="isAudit">
          <el-form-item label="审核状态" prop="">
            <el-radio-group v-model="form.status">
              <el-radio :label="1">审核通过</el-radio>
              <el-radio :label="2">审核拒绝</el-radio>
            </el-radio-group>
          </el-form-item>
        </el-row>
        <el-row v-if="isAudit && form.status == 2">
          <el-form-item label="拒绝原因" prop="">
            <el-input v-model="form.remark" type="textarea" placeholder="请输入拒绝原因" maxlength="200"/>
          </el-form-item>
        </el-row>
      </el-form>
      <div slot="footer" class="dialog-footer">
        <el-button type="primary" @click="submitAuditForm()" v-if="isAudit">确 定</el-button>
        <el-button type="primary" @click="submitForm" v-if="!isAudit">确 定</el-button>
        <el-button @click="cancel">取 消</el-button>
      </div>
    </el-dialog>

    <el-dialog title="发放券" :visible.sync="issueCoupons" width="520px" append-to-body>
      <el-form ref="form" :model="sendForm" :rules="sendRules" label-width="90px">
        <el-form-item label="用户手机号" prop="phonenumber">
          <el-input v-model="sendForm.phonenumber" placeholder="请输入用户手机号" :disabled="isAudit"/>
        </el-form-item>
      </el-form>
      <div slot="footer" class="dialog-footer">
        <el-button type="primary" @click="submitSendForm">确 定</el-button>
        <el-button @click="cancelSendForm">取 消</el-button>
      </div>
    </el-dialog>
  </div>
</template>

<script>
import { listCoupon, getCoupon, delCoupon, addCoupon, updateCoupon, auditCoupon, issueCoupons, allMerchantList } from "@/api/system/coupon"
import {checkPermi} from '@/utils/permission'
export default {
  name: "Coupon",
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
      // 优惠券表格数据
      couponList: [],
      // 弹出层标题
      title: "",
      // 是否显示弹出层
      open: false,
      issueCoupons: false,
      // 查询参数
      queryParams: {
        pageNum: 1,
        pageSize: 10,
        couponName: null,
        couponType: null,
        couponPrice: null,
        couponNo: null,
        couponLimit: null,
        validFrom: null,
        validEnd: null,
        status: null,
        sourceFrom: null,
        createByName: null
      },
      // 表单参数
      form: {},
      sendForm: {},
      // 表单校验
      rules: {
        couponName: [
          { required: true, message: "券名称不能为空", trigger: "blur" }
        ],
        couponType: [
          { required: true, message: "券类型不能为空", trigger: "change" }
        ],
        couponPrice :[
          { required: true, message: "金额不能为空", trigger: "blur" }
        ],
        quantity: [
          /* { required: true, message: "库存数量不能为空", trigger: "change" }, */
          {
            pattern: /^\d+$/,
            message: "库存数量只能为大于等于0的正整数",
            trigger: "blur"
          }
        ],
        purposeMerchantUserId: [
          { required: true, message: "适用门店", trigger: "blur" }
        ]
      },
      sendRules: {
        phonenumber: [
          {
            //pattern: /^1[3|4|5|6|7|8|9][0-9]\d{8}$/,
            pattern: /^\d+$/,
            message: "请输入正确的手机号码",
            trigger: "blur"
          }
        ],
      },
      isAudit: false,
      merchantList: []
    }
  },
  created() {
    this.getList()
    if(checkPermi(['system:role:manage', 'system:role:part_manage'])){
      this.getAllMerchantList()
    }
  },
  methods: {
    /** 查询优惠券列表 */
    getList() {
      this.loading = true
      listCoupon(this.queryParams).then(response => {
        this.couponList = response.rows
        this.total = response.total
        this.loading = false
      })
    },
    getAllMerchantList(){
      this.loading = true
      allMerchantList({}).then(response => {
        console.log(response)
        this.merchantList = response.data
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
        couponName: null,
        couponType: null,
        couponPrice: null,
        couponNo: null,
        couponLimit: null,
        validFrom: null,
        validEnd: null,
        status: null,
        sourceFrom: null,
        createTime: null,
        createBy: null,
        createByName: null,
        method: -1,
        purpose: 1
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
      this.isAudit = false;
      this.open = true
      this.title = "添加优惠券"
    },
    /** 修改按钮操作 */
    handleUpdate(row) {
      this.reset()
      const id = row.id || this.ids
      getCoupon(id).then(response => {
        this.form = response.data
        this.$set(this.form, 'validTime', [this.form.validFrom, this.form.validEnd]);
        this.$set(this.form, 'method', this.form.couponNo ? 1 : -1);
        this.form.purposeMerchantUserId = this.form.purposeMerchantUserId ? this.form.purposeMerchantUserId.split(",").map(Number) : this.form.purposeMerchantUserId
        //this.form.validTime = [this.form.validFrom, this.form.validEnd]
        //this.form.method = this.form.couponNo ? 1 : -1
        this.isAudit = false;
        this.open = true
        this.title = "修改优惠券"
      })
    },
    /**
     * 审核按钮操作
     */
    handleAudit(row){
      this.reset()
      const id = row.id || this.ids
      getCoupon(id).then(response => {
        this.form = response.data
        this.$set(this.form, 'validTime', [this.form.validFrom, this.form.validEnd]);
        this.$set(this.form, 'method', this.form.couponNo ? 1 : -1);
        //this.form.validTime = [this.form.validFrom, this.form.validEnd]
        //this.form.method = this.form.couponNo ? 1 : -1
        this.form.status = 1
        this.isAudit = true;
        this.open = true
        this.title = "审核优惠券"
      })
    },
    /**
     * 发放券
     * @param {*} row 
     */
    handleIssueCoupons(row){
      this.issueCoupons = true
      this.sendForm = {
        phonenumber: '',
        couponId: row.id
      }
    },
    /** 提交按钮 */
    submitForm() {
      this.$refs["form"].validate(valid => {
        if (valid) {
          if(this.form.validTime == null){
            this.$modal.msgError("请选择券有效时间")
            return false;
          }else{
            this.form.validFrom = this.form.validTime[0]
            this.form.validEnd = this.form.validTime[1]
          }

          if(this.form.method == -1){
            //批量券
            this.form.couponNo = ""
          }else{
            //指定券码的券
            this.form.quantity = 1
            if(!this.form.couponNo){
              this.$modal.msgError("请输入券码")
              return false;
            }
          }

          if(this.form.purpose == 1){
            //全部门店
            this.form.purposeMerchantUserId = ''
          }else if(this.form.purpose == 2){
            //指定门店
            this.form.purposeMerchantUserId = this.form.purposeMerchantUserId.join(",")
          }
          console.log(this.form)

          if (this.form.id != null) {
            updateCoupon(this.form).then(response => {
              this.$modal.msgSuccess("修改成功")
              this.open = false
              this.getList()
            })
          } else {
            addCoupon(this.form).then(response => {
              this.$modal.msgSuccess("新增成功")
              this.open = false
              this.getList()
            })
          }
        }
      })
    },
    /**
     * 发放券提交按钮
     */
    submitSendForm(){
      this.$refs["form"].validate(valid => {
        if (valid) {
          if(!this.sendForm.phonenumber){
            this.$modal.msgError("请输入用户手机号")
            return false;
          }

          console.log(this.sendForm)
          issueCoupons(this.sendForm).then(response => {
              this.$modal.msgSuccess("发放成功")
              this.issueCoupons = false
              this.getList()
          })
        }
      })
    },
    cancelSendForm(){
      this.issueCoupons = false
      this.sendForm = {
        phonenumber: '',
        couponId: ''
      }
    },
    /**
     * 提交审核
     */
    submitAuditForm(){
      console.log(this.form.status)
      if(this.form.id){
        if(this.form.status == 2){
          if(!this.form.remark){
            this.$modal.msgError("请输入拒绝原因")
            return false;
          }
        }
        var _data = {
          id: this.form.id,
          status: this.form.status,
          remark: this.form.remark,
        }
        auditCoupon(_data).then(response => {
          this.$modal.msgSuccess("操作成功")
          this.open = false
          this.getList()
        })
      }
    },
    /** 删除按钮操作 */
    handleDelete(row) {
      const ids = row.id || this.ids
      this.$modal.confirm('是否确认删除序号为"' + ids + '"的数据项？').then(function() {
        return delCoupon(ids)
      }).then(() => {
        this.getList()
        this.$modal.msgSuccess("删除成功")
      }).catch(() => {})
    },
    /** 导出按钮操作 */
    handleExport() {
      this.download('system/coupon/export', {
        ...this.queryParams
      }, `coupon_${new Date().getTime()}.xlsx`)
    }
  }
}
</script>
<style scoped>
::v-deep .el-dialog .el-select--default{
  width: 100%;
}
::v-deep .el-textarea__inner{
  height: 120px;
  width: 400px;
}
::v-deep .el-dialog__body .el-select{
  width: 100%;
}
</style>
