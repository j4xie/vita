<template>
  <div class="app-container">
    <el-form :model="queryParams" ref="queryForm" size="small" :inline="true" v-show="showSearch" label-width="68px">
      <el-form-item label="订单编号" prop="orderNo">
        <el-input
          v-model="queryParams.orderNo"
          placeholder="请输入订单编号"
          clearable
          @keyup.enter.native="handleQuery"
        />
      </el-form-item>
      <el-form-item label="订单用户" prop="createByName">
        <el-input
          v-model="queryParams.createByName"
          placeholder="请输入订单用户的法定姓名"
          clearable
          @keyup.enter.native="handleQuery"
        />
      </el-form-item>
      <el-form-item label="消费方式" prop="payMode">
        <el-select v-model="queryParams.payMode" clearable placeholder="请选择消费方式">
          <el-option
            :key="1"
            :label="'美元'"
            :value="1">
          </el-option>
          <el-option
            :key="2"
            :label="'积分'"
            :value="2">
          </el-option>
        </el-select>
      </el-form-item>
      <el-form-item label="订单状态" prop="orderStatus">
        <el-select v-model="queryParams.orderStatus" clearable placeholder="请选择订单状态">
          <el-option
            :key="1"
            :label="'待支付'"
            :value="1">
          </el-option>
          <el-option
            :key="2"
            :label="'已完成'"
            :value="2">
          </el-option>
          <el-option
            :key="5"
            :label="'待发货'"
            :value="5">
          </el-option>
          <el-option
            :key="6"
            :label="'待收货'"
            :value="6">
          </el-option>
          <el-option
            :key="3"
            :label="'已取消'"
            :value="3">
          </el-option>
          <el-option
            :key="4"
            :label="'已退款'"
            :value="4">
          </el-option>
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
          v-hasPermi="['system:order:add']"
        >新增</el-button>
      </el-col> -->
      <el-col :span="1.5">
        <el-button
          type="success"
          plain
          icon="el-icon-edit"
          size="mini"
          :disabled="single"
          @click="handleUpdate"
          v-hasPermi="['system:order:edit']"
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
          v-hasPermi="['system:order:remove']"
        >删除</el-button>
      </el-col>
      <el-col :span="1.5">
        <el-button
          type="warning"
          plain
          icon="el-icon-download"
          size="mini"
          @click="handleExport"
          v-hasPermi="['system:order:export']"
        >导出</el-button>
      </el-col>
      <right-toolbar :showSearch.sync="showSearch" @queryTable="getList"></right-toolbar>
    </el-row>

    <el-table v-loading="loading" :data="orderList" @selection-change="handleSelectionChange">
      <el-table-column type="selection" width="55" align="center" />
      <el-table-column label="序号" align="center" prop="id" />
      <el-table-column label="订单编号" align="center" prop="orderNo" width="240"/>
      <el-table-column label="订单状态" align="center" prop="orderStatus"><!-- 订单状态（1-待支付   2-已完成    3-已取消     4-已退款   5-待发货   6-待收货） -->
        <template slot-scope="scope">
          <span v-if="scope.row.orderStatus == 1"><el-tag type="success">待支付</el-tag></span>
          <span v-else-if="scope.row.orderStatus == 2"><el-tag>已完成</el-tag></span>
          <span v-else-if="scope.row.orderStatus == 3"><el-tag type="info">已取消</el-tag></span>
          <span v-else-if="scope.row.orderStatus == 4"><el-tag type="info">已退款</el-tag></span>
          <span v-else-if="scope.row.orderStatus == 5"><el-tag type="warning">待发货</el-tag></span>
          <span v-else-if="scope.row.orderStatus == 6"><el-tag>待收货</el-tag></span>
        </template>
      </el-table-column>
      <el-table-column label="订单类型" align="center" prop="orderType"><!-- 订单类型（1-积分商城消费   2-活动支付    3-会员等级支付） -->
        <template slot-scope="scope">
          <span v-if="scope.row.orderType == 1">积分兑换</span>
          <span v-else-if="scope.row.orderType == 2">参与活动</span>
          <span v-else-if="scope.row.orderType == 3">升级会员</span>
        </template>
      </el-table-column>
      <el-table-column label="消费方式" align="center" prop="payMode" >
        <template slot-scope="scope">
          <span v-if="scope.row.payMode == 1">美元</span>
          <span v-else-if="scope.row.payMode == 2">积分</span>
        </template>
      </el-table-column>
      <el-table-column label="订单描述" align="center" prop="orderDesc" width="200"/>
      <el-table-column label="订单金额" align="center" prop="price" />
      <el-table-column label="订单用户" align="center" prop="createByName" />
      <el-table-column label="创建时间" align="center" prop="createTime" width="180"></el-table-column>
      <el-table-column label="支付时间" align="center" prop="payTime" width="180"></el-table-column>
      <el-table-column label="退款时间" align="center" prop="refundTime" width="180"></el-table-column>
      <el-table-column label="关闭/取消时间" align="center" prop="cancelTime" width="180"></el-table-column>
      <el-table-column label="操作" align="center" fixed="right" width="180" class-name="small-padding fixed-width">
        <template slot-scope="scope">
          <el-button
            size="mini"
            type="text"
            icon="el-icon-delete"
            @click="handleDelete(scope.row)"
            v-hasPermi="['system:order:remove']"
          >删除</el-button>
          <el-button
            size="mini"
            type="text"
            icon="el-icon-edit"
            @click="handleUpdate(scope.row)"
            v-hasPermi="['system:order:edit']"
          >修改</el-button>
          <el-button
            size="mini"
            type="text"
            icon="el-icon-edit"
            @click="handleSendGoods(scope.row)"
            v-hasPermi="['system:order:list']"
            v-if="scope.row.orderStatus == 5"
          >发货</el-button>
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

    <!-- 添加或修改订单对话框 -->
    <el-dialog :title="title" :visible.sync="open" width="500px" append-to-body>
      <el-form ref="form" :model="form" :rules="rules" label-width="80px">
        <el-form-item label="积分商品表的id" prop="goodsId">
          <el-input v-model="form.goodsId" placeholder="请输入积分商品表的id" />
        </el-form-item>
        <el-form-item label="收货地址的id" prop="addrId">
          <el-input v-model="form.addrId" placeholder="请输入收货地址的id" />
        </el-form-item>
        <el-form-item label="订单编号" prop="orderNo">
          <el-input v-model="form.orderNo" placeholder="请输入订单编号" />
        </el-form-item>
        <el-form-item label="消费方式" prop="payMode">
          <el-input v-model="form.payMode" placeholder="请输入消费方式" />
        </el-form-item>
        <el-form-item label="订单描述" prop="orderDesc">
          <el-input v-model="form.orderDesc" placeholder="请输入订单描述" />
        </el-form-item>
        <el-form-item label="订单金额" prop="price">
          <el-input v-model="form.price" placeholder="请输入订单金额" />
        </el-form-item>
        <el-form-item label="订单创建者的user_id" prop="createById">
          <el-input v-model="form.createById" placeholder="请输入订单创建者的user_id" />
        </el-form-item>
        <el-form-item label="订单创建者的legal_name" prop="createByName">
          <el-input v-model="form.createByName" placeholder="请输入订单创建者的legal_name" />
        </el-form-item>
        <el-form-item label="支付时间" prop="payTime">
          <el-date-picker clearable
            v-model="form.payTime"
            type="date"
            value-format="yyyy-MM-dd"
            placeholder="请选择支付时间">
          </el-date-picker>
        </el-form-item>
        <el-form-item label="退款时间" prop="refundTime">
          <el-date-picker clearable
            v-model="form.refundTime"
            type="date"
            value-format="yyyy-MM-dd"
            placeholder="请选择退款时间">
          </el-date-picker>
        </el-form-item>
        <el-form-item label="关闭/取消时间" prop="cancelTime">
          <el-date-picker clearable
            v-model="form.cancelTime"
            type="date"
            value-format="yyyy-MM-dd"
            placeholder="请选择关闭/取消时间">
          </el-date-picker>
        </el-form-item>
      </el-form>
      <div slot="footer" class="dialog-footer">
        <el-button type="primary" @click="submitForm">确 定</el-button>
        <el-button @click="cancel">取 消</el-button>
      </div>
    </el-dialog>


    <!-- 发货，填入物流信息 -->
    <el-dialog title="物流信息" :visible.sync="logisticsOpen" width="500px" append-to-body>
      <el-form ref="form" :model="logisticsForm" :rules="logisticsRules" label-width="80px">
        <el-form-item label="物流公司" prop="logisticsCompany">
          <el-input v-model="logisticsForm.logisticsCompany" placeholder="请输入物流公司" maxlength="40"/>
        </el-form-item>
        <el-form-item label="物流单号" prop="trackingNumber">
          <el-input v-model="logisticsForm.trackingNumber" placeholder="请输入物流单号" maxlength="40" />
        </el-form-item>
      </el-form>
      <div slot="footer" class="dialog-footer">
        <el-button type="primary" @click="submitSendForm">确 定</el-button>
        <el-button @click="cancelSend">取 消</el-button>
      </div>
    </el-dialog>
  </div>
</template>

<script>
import { listOrder, getOrder, delOrder, addOrder, updateOrder, sendOrderGoods } from "@/api/system/order"

export default {
  name: "Order",
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
      // 订单表格数据
      orderList: [],
      // 弹出层标题
      title: "",
      // 是否显示弹出层
      open: false,
      logisticsOpen: false,
      // 查询参数
      queryParams: {
        pageNum: 1,
        pageSize: 10,
        goodsId: null,
        addrId: null,
        orderNo: null,
        orderStatus: null,
        orderType: null,
        payMode: null,
        orderDesc: null,
        price: null,
        createById: null,
        createByName: null,
        payTime: null,
        refundTime: null,
        cancelTime: null
      },
      // 表单参数
      form: {},
      logisticsForm: {},
      // 表单校验
      rules: {
      },
      logisticsRules: {
        logisticsCompany: [
          { required: true, message: "物流公司不能为空", trigger: "blur" },
        ],
        trackingNumber: [
          { required: true, message: "物流单号不能为空", trigger: "blur" },
        ],
      }
    }
  },
  created() {
    this.getList()
  },
  methods: {
    /** 查询订单列表 */
    getList() {
      this.loading = true
      listOrder(this.queryParams).then(response => {
        this.orderList = response.rows
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
        goodsId: null,
        addrId: null,
        orderNo: null,
        orderStatus: null,
        orderType: null,
        payMode: null,
        orderDesc: null,
        price: null,
        createById: null,
        createByName: null,
        createTime: null,
        payTime: null,
        refundTime: null,
        cancelTime: null
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
      this.title = "添加订单"
    },
    /** 修改按钮操作 */
    handleUpdate(row) {
      this.reset()
      const id = row.id || this.ids
      getOrder(id).then(response => {
        this.form = response.data
        this.open = true
        this.title = "修改订单"
      })
    },
    /**
     * 发货按钮操作
     */
    handleSendGoods(row){
      const _id = row.id
      this.logisticsOpen = true
      this.logisticsForm = {
        id: _id,
        trackingNumber: '',
        logisticsCompany: ''
      }
    },
    /** 提交按钮 */
    submitForm() {
      this.$refs["form"].validate(valid => {
        if (valid) {
          if (this.form.id != null) {
            updateOrder(this.form).then(response => {
              this.$modal.msgSuccess("修改成功")
              this.open = false
              this.getList()
            })
          } else {
            addOrder(this.form).then(response => {
              this.$modal.msgSuccess("新增成功")
              this.open = false
              this.getList()
            })
          }
        }
      })
    },
    /**
     * 确认发货按钮
     */
    submitSendForm() {
      this.$refs["form"].validate(valid => {
        if (valid) {
          if (this.logisticsForm.id != null) {
            sendOrderGoods(this.logisticsForm).then(response => {
              this.$modal.msgSuccess("发货成功")
              this.logisticsOpen = false
              this.getList()
            })
          } 
        }
      })
    },
    cancelSend() {
      this.logisticsOpen = false
      this.logisticsForm = {
        id: '',
        trackingNumber: '',
        logisticsCompany: ''
      }
    },
    /** 删除按钮操作 */
    handleDelete(row) {
      const ids = row.id || this.ids
      this.$modal.confirm('是否确认删除订单编号为"' + ids + '"的数据项？').then(function() {
        return delOrder(ids)
      }).then(() => {
        this.getList()
        this.$modal.msgSuccess("删除成功")
      }).catch(() => {})
    },
    /** 导出按钮操作 */
    handleExport() {
      this.download('system/order/export', {
        ...this.queryParams
      }, `order_${new Date().getTime()}.xlsx`)
    }
  }
}
</script>
