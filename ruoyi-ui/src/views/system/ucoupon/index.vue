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
      <el-form-item label="状态" prop="status">
        <el-select v-model="queryParams.status" clearable placeholder="请选择状态">
          <el-option
            :key="1"
            :label="'未使用'"
            :value="1">
          </el-option>
          <el-option
            :key="-1"
            :label="'已使用'"
            :value="-1">
          </el-option>
          <el-option
            :key="2"
            :label="'已过期'"
            :value="2">
          </el-option>
        </el-select>
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
      <el-col :span="1.5">
        <el-button
          type="success"
          plain
          icon="el-icon-edit"
          size="mini"
          :disabled="single"
          @click="handleUpdate"
          v-hasPermi="['system:coupon:edit']"
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
          v-hasPermi="['system:coupon:remove']"
        >删除</el-button>
      </el-col>
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
      <el-table-column label="序号" align="center" prop="id" />
      <el-table-column label="券码" align="center" prop="couponNo" width="200"/>
      <el-table-column label="券名称" align="center" prop="couponName" width="200"/>
      <el-table-column label="券类型" align="center" prop="couponType">
        <template slot-scope="scope">
          <span v-if="scope.row.couponType == 1">代金券</span>
          <span v-else></span>
        </template>
      </el-table-column>
      <el-table-column label="券金额" align="center" prop="couponPrice" />
      <el-table-column label="使用门槛" align="center" prop="couponLimit">
        <template slot-scope="scope">
          <span v-if="scope.row.couponLimit == 0">无门槛</span>
          <span v-else>满{{scope.row.couponLimit}}可用</span>
        </template>
      </el-table-column>
      <el-table-column label="优惠券使用规则" align="center" prop="couponRules" width="150"/>
      <!-- <el-table-column label="有效期开始时间" align="center" prop="validFrom" width="180">
        <template slot-scope="scope">
          <span>{{ scope.row.validFrom }}</span>
        </template>
      </el-table-column>
      <el-table-column label="有效期结束时间" align="center" prop="validEnd" width="180">
        <template slot-scope="scope">
          <span>{{ scope.row.validEnd }}</span>
        </template>
      </el-table-column> -->
      <el-table-column label="有效期" align="center" prop="validFrom" width="180">
        <template slot-scope="scope">
          <div style="display: flex; flex-direction: column;">
            <span style="line-height: normal;">{{ scope.row.validFrom }}</span>
            <span style="line-height: normal;">~</span>
            <span style="line-height: normal;">{{ scope.row.validEnd}}</span>
          </div> 
        </template>
      </el-table-column>
      <el-table-column label="适用门店" align="center" prop="purpose" width="180">
        <template slot-scope="scope">
          <span v-if="scope.row.purpose == 1">全部门店</span>
          <span v-if="scope.row.purpose == 2">{{scope.row.purposeMerchantName}}</span>
        </template>
      </el-table-column>
      <el-table-column label="数量" align="center" prop="quantity" />
      <el-table-column label="状态" align="center" prop="status">
        <template slot-scope="scope">
          <span v-if="scope.row.status == -1"><el-tag>已使用</el-tag></span>
          <span v-else-if="scope.row.status == 1"><el-tag type="success">未使用</el-tag></span>
          <span v-else-if="scope.row.status == 2"><el-tag type="info">已过期</el-tag></span>
        </template>
      </el-table-column>
      <el-table-column label="来源" align="center" prop="sourceFrom">
        <template slot-scope="scope">
          <span v-if="scope.row.sourceFrom == 1">商家</span>
          <span v-else>平台</span>
        </template>
      </el-table-column>
      <el-table-column label="券所有人" align="center" prop="legalName" />
      <el-table-column label="创建人" align="center" prop="createByName" />
      <!-- <el-table-column label="操作" fixed="right" align="center" class-name="small-padding fixed-width" width="180">
        <template slot-scope="scope">
          <el-button
            size="mini"
            type="text"
            icon="el-icon-edit"
            @click="handleUpdate(scope.row)"
            v-hasPermi="['system:coupon:edit']"
          >修改</el-button>
          <el-button
            size="mini"
            type="text"
            icon="el-icon-delete"
            @click="handleDelete(scope.row)"
            v-hasPermi="['system:coupon:remove']"
          >删除</el-button>
        </template>
      </el-table-column> -->
    </el-table>
    
    <pagination
      v-show="total>0"
      :total="total"
      :page.sync="queryParams.pageNum"
      :limit.sync="queryParams.pageSize"
      @pagination="getList"
    />

    <!-- 添加或修改用户关联优惠券对话框 -->
    <el-dialog :title="title" :visible.sync="open" width="500px" append-to-body>
      <el-form ref="form" :model="form" :rules="rules" label-width="80px">
        <el-form-item label="券表id" prop="couponId">
          <el-input v-model="form.couponId" placeholder="请输入券表id" />
        </el-form-item>
        <el-form-item label="用户user_id" prop="userId">
          <el-input v-model="form.userId" placeholder="请输入用户user_id" />
        </el-form-item>
        <el-form-item label="券名称" prop="couponName">
          <el-input v-model="form.couponName" placeholder="请输入券名称" />
        </el-form-item>
        <el-form-item label="券金额" prop="couponPrice">
          <el-input v-model="form.couponPrice" placeholder="请输入券金额" />
        </el-form-item>
        <el-form-item label="券码" prop="couponNo">
          <el-input v-model="form.couponNo" placeholder="请输入券码" />
        </el-form-item>
        <el-form-item label="使用门槛" prop="couponLimit">
          <el-input v-model="form.couponLimit" placeholder="请输入使用门槛" />
        </el-form-item>
        <el-form-item label="优惠券使用规则" prop="couponRules">
          <el-input v-model="form.couponRules" type="textarea" placeholder="请输入内容" />
        </el-form-item>
        <el-form-item label="有效期开始时间" prop="validFrom">
          <el-date-picker clearable
            v-model="form.validFrom"
            type="date"
            value-format="yyyy-MM-dd"
            placeholder="请选择有效期开始时间">
          </el-date-picker>
        </el-form-item>
        <el-form-item label="有效期结束时间" prop="validEnd">
          <el-date-picker clearable
            v-model="form.validEnd"
            type="date"
            value-format="yyyy-MM-dd"
            placeholder="请选择有效期结束时间">
          </el-date-picker>
        </el-form-item>
        <el-form-item label="数量，用户的数量都是1" prop="quantity">
          <el-input v-model="form.quantity" placeholder="请输入数量，用户的数量都是1" />
        </el-form-item>
        <el-form-item label="来源" prop="sourceFrom">
          <el-input v-model="form.sourceFrom" placeholder="请输入来源" />
        </el-form-item>
        <el-form-item label="创建人user_id" prop="createByUserId">
          <el-input v-model="form.createByUserId" placeholder="请输入创建人user_id" />
        </el-form-item>
        <el-form-item label="创建人" prop="createByName">
          <el-input v-model="form.createByName" placeholder="请输入创建人" />
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
import { listCoupon, getCoupon, delCoupon, addCoupon, updateCoupon } from "@/api/system/user_coupon"

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
      // 用户关联优惠券表格数据
      couponList: [],
      // 弹出层标题
      title: "",
      // 是否显示弹出层
      open: false,
      // 查询参数
      queryParams: {
        pageNum: 1,
        pageSize: 10,
        couponId: null,
        userId: null,
        couponName: null,
        couponType: null,
        couponPrice: null,
        couponNo: null,
        couponLimit: null,
        couponRules: null,
        validFrom: null,
        validEnd: null,
        quantity: null,
        status: null,
        sourceFrom: null,
        createByUserId: null,
        createByName: null,
      },
      // 表单参数
      form: {},
      // 表单校验
      rules: {
        couponName: [
          { required: true, message: "券名称不能为空", trigger: "blur" }
        ],
        couponType: [
          { required: true, message: "券类型不能为空", trigger: "change" }
        ],
      }
    }
  },
  created() {
    this.getList()
  },
  methods: {
    /** 查询用户关联优惠券列表 */
    getList() {
      this.loading = true
      listCoupon(this.queryParams).then(response => {
        this.couponList = response.rows
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
        couponId: null,
        userId: null,
        couponName: null,
        couponType: null,
        couponPrice: null,
        couponNo: null,
        couponLimit: null,
        couponRules: null,
        validFrom: null,
        validEnd: null,
        quantity: null,
        status: null,
        sourceFrom: null,
        createByUserId: null,
        createByName: null,
        createTime: null
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
      this.title = "添加用户关联优惠券"
    },
    /** 修改按钮操作 */
    handleUpdate(row) {
      this.reset()
      const id = row.id || this.ids
      getCoupon(id).then(response => {
        this.form = response.data
        this.open = true
        this.title = "修改用户关联优惠券"
      })
    },
    /** 提交按钮 */
    submitForm() {
      this.$refs["form"].validate(valid => {
        if (valid) {
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
    /** 删除按钮操作 */
    handleDelete(row) {
      const ids = row.id || this.ids
      this.$modal.confirm('是否确认删除用户关联优惠券编号为"' + ids + '"的数据项？').then(function() {
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
