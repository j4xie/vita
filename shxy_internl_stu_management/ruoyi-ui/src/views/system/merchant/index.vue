<template>
  <div class="app-container">
    <el-form :model="queryParams" ref="queryForm" size="small" :inline="true" v-show="showSearch" label-width="120px">
      <el-form-item label="Business Name" prop="merchantName">
        <el-input
          v-model="queryParams.merchantName"
          placeholder="Please input business name"
          clearable
          @keyup.enter.native="handleQuery"
        />
      </el-form-item>
      <el-form-item label="Principal Type" prop="principalType">
        <el-select v-model="queryParams.principalType" placeholder="Please select">
          <el-option :key="1" :label="'Person'" :value="1"></el-option>
          <el-option :key="2" :label="'Company'" :value="2"></el-option>
        </el-select>
      </el-form-item>
      <el-form-item label="Status" prop="status">
        <el-select v-model="queryParams.status" placeholder="Please select">
          <el-option :key="1" :label="'Under Review'" :value="1"></el-option>
          <el-option :key="3" :label="'Approved'" :value="3"></el-option>
          <el-option :key="2" :label="'Rejected'" :value="2"></el-option>
          <el-option :key="-1" :label="'Frozen'" :value="-1"></el-option>
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
          v-hasPermi="['system:merchant:add']"
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
          v-hasPermi="['system:merchant:edit']"
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
          v-hasPermi="['system:merchant:remove']"
        >删除</el-button>
      </el-col> -->
      <el-col :span="1.5">
        <el-button
          type="warning"
          plain
          icon="el-icon-download"
          size="mini"
          @click="handleExport"
          v-hasPermi="['system:merchant:export']"
        >导出</el-button>
      </el-col>
      <right-toolbar :showSearch.sync="showSearch" @queryTable="getList" :columns="columns"></right-toolbar>
    </el-row>

    <el-table v-loading="loading" :data="merchantList" @selection-change="handleSelectionChange">
      <el-table-column type="selection" width="55" align="center" />
      <el-table-column label="No" align="center" prop="id" width="60" v-if="columns.id.visible"/>
      <el-table-column label="Business Name" align="center" prop="merchantName" width="180" v-if="columns.merchantName.visible"/>
      <el-table-column label="LOGO" align="center" prop="logo" v-if="columns.logo.visible" width="80">
        <template slot-scope="scope">
          <img :src="scope.row.logo" style="height: 60px;"/>
        </template>
      </el-table-column>
      <el-table-column label="Business Introduction" align="center" prop="merchantDesc" width="180" v-if="columns.merchantDesc.visible" :show-overflow-tooltip="true"/>
      <el-table-column label="Shop Address" align="center" prop="merchantAddress" width="180" v-if="columns.merchantAddress.visible"/>
      <el-table-column label="Employer Identification Number" align="center" prop="ein" width="240" v-if="columns.ein.visible"/>
      <el-table-column label="School" align="center" prop="deptName" width="240" />
      <el-table-column label="Principal Type" align="center" prop="principalType" width="120" v-if="columns.principalType.visible">
        <template slot-scope="scope">
          <span v-if="scope.row.principalType == 1" >Person</span>
          <span v-else-if="scope.row.principalType == 2" >Company</span>
        </template>
      </el-table-column>
      <el-table-column label="Status" align="center" prop="status" width="110" v-if="columns.status.visible">
        <template slot-scope="scope">
          <span v-if="scope.row.status == -1"><el-tag type="warning">Frozen</el-tag></span>
          <span v-else-if="scope.row.status == 1"><el-tag type="success">Under Review</el-tag></span>
          <span v-else-if="scope.row.status == 2"><el-tag type="danger">Rejected</el-tag></span>
          <span v-else-if="scope.row.status == 3"><el-tag>Approved</el-tag></span>
        </template>
      </el-table-column>
      <el-table-column label="Create Time" align="center" prop="createTime" width="240" v-if="columns.createTime.visible"/>
      <el-table-column label="操作" fixed="right" align="center" class-name="small-padding fixed-width" width="180">
        <template slot-scope="scope">
          <el-button
            size="mini"
            type="text"
            icon="el-icon-edit"
            @click="handleUpdate(scope.row)"
            v-hasPermi="['system:merchant:edit']"
            v-if="scope.row.status == 2"
          >修改</el-button>
          <el-button
            size="mini"
            type="text"
            icon="el-icon-edit"
            @click="handleAudit(scope.row)"
            v-hasPermi="['system:merchant:audit']"
            v-if="scope.row.status == 1"
          >审核</el-button>
          <el-button
            size="mini"
            type="text"
            icon="el-icon-delete"
            @click="handleDelete(scope.row)"
            v-hasPermi="['system:merchant:remove']"
          >删除</el-button>
          <el-button
            size="mini"
            type="text"
            icon="el-icon-tickets"
            @click="showLogs(scope.row)"
            v-hasPermi="['system:user:resetPwd']"
          >日志</el-button>
          <!-- <el-dropdown size="mini" @command="(command) => handleCommand(command, scope.row)" >
            <el-button size="mini" type="text" icon="el-icon-d-arrow-right">更多</el-button>
            <el-dropdown-menu slot="dropdown">
              <el-dropdown-item command="handleShowLogs" icon="el-icon-key" v-hasPermi="['system:user:resetPwd']">操作日志</el-dropdown-item>
            </el-dropdown-menu>
          </el-dropdown> -->
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

    <!-- 添加或修改商户对话框 -->
    <el-dialog :title="title" :visible.sync="open" width="1000px" append-to-body class="el-body-dialog">
      <el-form ref="form" :model="form" :rules="rules" label-width="180px">
        <el-form-item label="Business Name" prop="merchantName">
          <el-input v-model="form.merchantName" placeholder="Please input" maxlength="80" :disabled="isAudit"/>
        </el-form-item>
        <el-form-item label="Business English Name" prop="merchantEnName">
          <el-input v-model="form.merchantEnName" placeholder="Please input" maxlength="80" :disabled="isAudit"/>
        </el-form-item>
        <el-form-item label="Business Introduction" prop="merchantDesc">
          <el-input v-model="form.merchantDesc" type="textarea" placeholder="Please input" maxlength="300" :disabled="isAudit"/>
        </el-form-item>
        <el-row>
          <el-col :span="12">
            <el-form-item label="LOGO" prop="logo">
              <BigFileUpload 
                @handleUploadSuccess="handleUploadSuccess"
                :defaultUrl = "form.logo"
                :imgWidth="138"
                :imgHeight="138"
                :flag="1"
                :isOnlyShow="isAudit"
              />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="Shop Picture" prop="shopImg">
              <BigFileUpload 
                @handleUploadSuccess="handleUploadSuccess"
                :defaultUrl = "form.shopImg"
                :imgWidth="200"
                :imgHeight="138"
                :flag="2"
                :isOnlyShow="isAudit"
              />
            </el-form-item>
          </el-col>
        </el-row>
        <el-row>
          <el-col :span="12">
            <el-form-item label="Select School" prop="deptId">
              <el-select v-model="form.deptId" clearable placeholder="Please select" :disabled="isAudit">
                <el-option
                  v-for="item in deptList"
                  :key="item.deptId"
                  :label="item.deptName"
                  :value="item.deptId">
                </el-option>
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12">
          </el-col>
        </el-row>
        <el-row>
          <el-col :span="12">
            <el-form-item label="Principal Type" prop="principalType">
              <el-select v-model="form.principalType" clearable placeholder="Please select" :disabled="isAudit">
                <el-option
                  :key="1"
                  :label="'Person'"
                  :value="1">
                </el-option>
                <el-option
                  :key="2"
                  :label="'Company'"
                  :value="2">
                </el-option>
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12">
          </el-col>
        </el-row>
        <el-row>
          <el-col :span="12">
            <el-form-item label="Bank Name" prop="accountName">
              <el-input v-model="form.accountName" placeholder="Please input" maxlength="50" :disabled="isAudit"/>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="Account number" prop="bankAccount">
              <el-input v-model="form.bankAccount" placeholder="Please input" maxlength="25" :disabled="isAudit"/>
            </el-form-item>
          </el-col>
        </el-row>
        <!-- <el-row>
          <el-col :span="12">
            <el-form-item label="开户名称" prop="accountName">
              <el-input v-model="form.accountName" placeholder="请输入开户名称" maxlength="50" :disabled="isAudit"/>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="开户银行" prop="openingBank">
              <el-input v-model="form.openingBank" placeholder="请输入开户行" maxlength="50" :disabled="isAudit"/>
            </el-form-item>
          </el-col>
        </el-row> -->
        <el-row>
          <el-col :span="12">
            <el-form-item label="Routing Number" prop="rn">
              <el-input v-model="form.rn" placeholder="Please input" maxlength="25" :disabled="isAudit"/>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="Account Holder Name" prop="acHolderName">
              <el-input v-model="form.acHolderName" placeholder="Please input" maxlength="18" :disabled="isAudit"/>
            </el-form-item>
          </el-col>
        </el-row>
        <el-form-item label="Social Security Number" prop="ssn" v-if="form.principalType == 1">
          <el-input v-model="form.ssn" placeholder="Please input" maxlength="18" :disabled="isAudit"/>
        </el-form-item>
        <el-form-item label="Employer Identification Number" prop="ein" class="lon-txt" v-if="form.principalType == 2">
          <el-input v-model="form.ein" placeholder="Please input" maxlength="18" :disabled="isAudit"/>
        </el-form-item>
        <el-form-item label="Authorized Representative ID" prop="legalPerCard" class="lon-txt">
          <el-input v-model="form.legalPerCard" placeholder="Please input" maxlength="20" :disabled="isAudit"/>
        </el-form-item>
        <el-form-item label="Authorized Representative Name" prop="legalName" class="lon-txt">
          <el-input v-model="form.legalName" placeholder="Please input" maxlength="50" :disabled="isAudit"/>
        </el-form-item>
        <el-form-item label="Shop Address" prop="merchantAddress">
          <el-input v-model="form.merchantAddress" placeholder="请点击选择地址按钮选择位置" maxlength="120" :disabled="isAudit" readonly>
            <el-button slot="append" @click="choseMap" :disabled="isAudit">选择地址</el-button>
          </el-input>
        </el-form-item>
        <el-row>
          <el-col :span="12">
            <el-form-item label="Zipcode" prop="zipcode">
              <el-input v-model="form.zipcode" placeholder="Please input" maxlength="20" :disabled="isAudit"/>
            </el-form-item>
          </el-col>
          <el-col :span="12">
          </el-col>
        </el-row>
        <el-row>
          <el-col :span="12">
            <el-form-item label="Phone Number" prop="phonenumber">
              <el-input v-model="form.phonenumber" placeholder="Please input" maxlength="20" :disabled="isAudit"/>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="Email" prop="email">
              <el-input v-model="form.email" placeholder="Please input" maxlength="18" :disabled="isAudit"/>
            </el-form-item>
          </el-col>
        </el-row>
        <el-row>
          <el-col :span="12">
            <el-form-item label="Login Username" prop="userName">
              <el-input v-model="form.userName" placeholder="Please input" maxlength="30" :disabled="isAudit"/>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="Login Password" prop="password" v-if="form.userId == undefined">
              <el-input v-model="form.password" placeholder="Please input" type="password" maxlength="20" show-password :disabled="isAudit"/>
            </el-form-item>
          </el-col>
        </el-row>
        <el-row>
          <el-col :span="12">
            <el-form-item label="Business Registration Document" prop="businessLicense">
              <BigFileUpload 
                @handleUploadSuccess="handleUploadSuccess"
                :defaultUrl = "form.businessLicense"
                :imgWidth="180"
                :imgHeight="138"
                :flag="3"
                :isOnlyShow="isAudit"
              />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="Permit License" prop="permitLicense">
              <BigFileUpload 
                @handleUploadSuccess="handleUploadSuccess"
                :defaultUrl = "form.permitLicense"
                :imgWidth="180"
                :imgHeight="138"
                :flag="4"
                :isOnlyShow="isAudit"
              />
            </el-form-item>
          </el-col>
        </el-row>
        <el-row v-if="isAudit">
          <el-form-item label="审核状态" prop="">
            <el-radio-group v-model="auditStatus">
              <el-radio :label="3">审核通过</el-radio>
              <el-radio :label="2">审核拒绝</el-radio>
            </el-radio-group>
          </el-form-item>
        </el-row>
        <el-row v-if="isAudit && auditStatus == 2">
          <el-form-item label="拒绝原因" prop="">
            <el-input v-model="form.reason" type="textarea" placeholder="请输入拒绝原因" maxlength="200"/>
          </el-form-item>
        </el-row>
      </el-form>
      <div slot="footer" class="dialog-footer">
        <el-button type="primary" @click="submitAuditForm()" v-if="isAudit">确 定</el-button>
        <el-button type="primary" @click="submitForm" v-if="!isAudit">确 定</el-button>
        <el-button @click="cancel">取 消</el-button>
      </div>
    </el-dialog>


  <el-dialog title="操作日志" :visible.sync="showLog" width="700px" append-to-body>
    <el-table
      :data="logList"
      border
      style="width: 100%">
      <el-table-column
        prop="operateTime"
        label="操作时间">
      </el-table-column>
      <el-table-column
        prop="operatName"
        label="操作"
        width="100">
      </el-table-column>
      <el-table-column
        prop="operateRemark"
        label="记录"
        width="200">
      </el-table-column>
      <el-table-column
        prop="operateByName"
        label="操作人">
      </el-table-column>
    </el-table>
  </el-dialog>

  <el-dialog title="选择位置" :visible.sync="openMap" width="1000px" append-to-body>
      <div style="height: 500px;">
        <!-- 搜索框 -->
        <div style="margin-bottom: 15px;">
          <el-input
            v-model="searchKeyword"
            placeholder="请输入关键词搜索位置（如：北京市天安门、上海外滩等）"
            @keyup.enter.native="searchLocation"
            clearable>
            <el-button slot="append" @click="searchLocation" :loading="searchLoading">搜索</el-button>
          </el-input>
        </div>
        
        <!-- Google地图容器 -->
        <div id="google-map" style="width: 100%; height: 350px; border: 1px solid #ddd;"></div>
        
        <!-- 地址信息显示 -->
        <div style="margin-top: 15px; padding: 15px; background-color: #f5f5f5; border-radius: 4px;">
          <el-form ref="mapForm" label-width="100px">
            <el-row :gutter="20">
              <el-col :span="12">
                <el-form-item label="详细地址:">
                  <el-input v-model="selectedAddress" placeholder="请在地图上点击选择位置或使用搜索功能" readonly></el-input>
                </el-form-item>
              </el-col>
              <el-col :span="6">
                <el-form-item label="纬度:">
                  <el-input v-model="selectedLatitude" placeholder="纬度" readonly></el-input>
                </el-form-item>
              </el-col>
              <el-col :span="6">
                <el-form-item label="经度:">
                  <el-input v-model="selectedLongitude" placeholder="经度" readonly></el-input>
                </el-form-item>
              </el-col>
            </el-row>
          </el-form>
        </div>
      </div>
      
      <div slot="footer" class="dialog-footer">
        <el-button @click="closeMapDialog">取消</el-button>
        <el-button type="primary" @click="confirmLocation" :disabled="!selectedAddress">确认位置</el-button>
      </div>
  </el-dialog>

  </div>
</template>

<script>
import { listMerchant, getMerchant, delMerchant, addMerchant, updateMerchant, auditMerchant, listSchool } from "@/api/system/merchant"
import {listLog} from "@/api/system/merchant_log"
import BigFileUpload from '../../../components/BigFileUpload/index.vue'
// 使用CDN方式加载Google Maps，避免webpack编译问题
export default {
  name: "Merchant",
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
      // 商户表格数据
      merchantList: [],
      // 弹出层标题
      title: "",
      // 是否显示弹出层
      open: false,
      openMap: false,
      showLog: false,
      auditStatus: 3,
      // 列信息
      columns: {
        id: { label: 'No', visible: true },
        merchantName: { label: 'Business Name', visible: true },
        logo: { label: 'LOGO', visible: true },
        merchantDesc: { label: 'Business Introduction', visible: false },
        merchantAddress: { label: 'Shop Address', visible: true },
        ein: { label: 'Employer Identification Number', visible: true },
        principalType: { label: 'Principal Type', visible: true },
        status: { label: 'Status', visible: true },
        createTime: { label: 'Create Time', visible: true }
      },
      // 表单校验
      rules: {
        deptId: [
          { required: true, message: "Please select school", trigger: "blur" }
        ],
        principalType: [
          { required: true, message: "Please select principal type", trigger: "blur" }
        ],
        merchantName: [
          { required: true, message: "Please input business name", trigger: "blur" }
        ],
        merchantAddress: [
          { required: true, message: "请输入店铺地址", trigger: "blur" }
        ],
        ein: [
          { required: true, message: "Please input employer identification number", trigger: "blur" }
        ],
        ssn: [
          { required: true, message: "Please input social security number", trigger: "blur" }
        ],
        bankAccount: [
          { required: true, message: "Please input account number", trigger: "blur" }
        ],
        rn: [
          { required: true, message: "Please input routing number", trigger: "blur" }
        ],
        acHolderName: [
          { required: true, message: "Please input account holder name", trigger: "blur" }
        ],
        userName: [
          { required: true, message: "Please input login username", trigger: "blur" },
          { min: 2, max: 20, message: 'login username length must between 2 and 20', trigger: 'blur' }
        ],
        legalName: [
          { required: true, message: "Please input authorized representative name", trigger: "blur" }
        ],
        password: [
          { required: true, message: "用户密码不能为空", trigger: "blur" },
          { min: 5, max: 20, message: '用户密码长度必须介于 5 和 20 之间', trigger: 'blur' },
          { pattern: /^[^<>"'|\\]+$/, message: "不能包含非法字符：< > \" ' \\\ |", trigger: "blur" }
        ],
        phonenumber: [
          {
            //pattern: /^1[3|4|5|6|7|8|9][0-9]\d{8}$/,
            pattern: /^\d+$/,
            message: "请输入正确的手机号码",
            trigger: "blur"
          }
        ],
        email: [
          {
            type: "email",
            message: "请输入正确的邮箱地址",
            trigger: ["blur", "change"]
          }
        ],
        businessLicense: [
          { required: true, message: "Please upload business registration document", trigger: "blur" }
        ],
      },
      // 默认密码
      initPassword: undefined,
      // 查询参数
      queryParams: {
        pageNum: 1,
        pageSize: 10,
        userId: null,
        merchantName: null,
        logo: null,
        shopImg: null,
        merchantDesc: null,
        merchantAddress: null,
        ein: null,
        legalPerCard: null,
        merchantType: null,
        accountName: null,
        bankAccount: null,
        openingBank: null,
        openingBankAddr: null,
        businessLicense: null,
        permitLicense: null,
        status: null,
      },
      // 表单参数
      form: {},
      imageUrl: '',
      serverUrl: process.env.VUE_APP_FILE_SERVER_URL, // 这里写你要上传的图片服务器地址
      isAudit: false,//打开弹出是否为审核操作
      logList: [],
      deptList: [],
      // 地图相关数据
      selectedAddress: '',
      selectedLatitude: '',
      selectedLongitude: '',
      map: null,
      marker: null,
      geocoder: null,
      mapLoading: false,
      // 搜索相关数据
      searchKeyword: '',
      searchLoading: false,
      placesService: null,
    }
  },
  created() {
    this.getConfigKey("sys.user.initPassword").then(response => {
      this.initPassword = response.msg
    })
    this.getList()
    this.getSchoolList();
  },
  beforeDestroy() {
    // 组件销毁前清理地图实例
    this.cleanupMap();
  },
  methods: {
    getSchoolList(){
      listSchool({}).then(response => {
        this.deptList = response.data
      })
    },
    /** 查询商户列表 */
    getList() {
      this.loading = true
      listMerchant(this.queryParams).then(response => {
        this.merchantList = response.rows
        this.total = response.total
        this.loading = false
      })
    },
    choseMap(){
      this.openMap = true;
      this.$nextTick(() => {
        this.initGoogleMap();
      });
    },
    
    // 初始化Google地图
    initGoogleMap() {
      // 检查Google Maps API是否已加载
      if (window.google && window.google.maps) {
        this.createMap();
        return;
      }

      // 检查是否已经在加载中
      if (this.mapLoading) {
        return;
      }
      this.mapLoading = true;

      // 动态加载Google Maps API
      const script = document.createElement('script');
      script.src = `https://maps.googleapis.com/maps/api/js?key=AIzaSyA8l6T6nQmrR9JIFHGnq9mgrOGYCzT8aEg&libraries=places&callback=initGoogleMapCallback_${Date.now()}`;
      script.async = true;
      script.defer = true;
      
      // 生成唯一的回调函数名
      const callbackName = `initGoogleMapCallback_${Date.now()}`;
      
      // 设置全局回调函数
      window[callbackName] = () => {
        try {
          this.createMap();
          // 清理回调函数
          delete window[callbackName];
        } catch (error) {
          console.error('Google Maps初始化失败:', error);
          this.$message.error('地图初始化失败');
        } finally {
          this.mapLoading = false;
        }
      };
      
      script.onerror = () => {
        console.error('Google Maps API加载失败');
        this.$message.error('地图加载失败，请检查网络连接');
        this.mapLoading = false;
        // 清理回调函数
        delete window[callbackName];
      };
      
      document.head.appendChild(script);
    },

    // 创建地图实例
    createMap() {
      try {
        // 检查地图容器是否存在
        const mapElement = document.getElementById("google-map");
        if (!mapElement) {
          console.error('地图容器不存在');
          this.$message.error('地图容器不存在');
          return;
        }

        // 检查Google Maps API是否可用
        if (!window.google || !window.google.maps) {
          console.error('Google Maps API未加载');
          this.$message.error('Google Maps API未加载');
          return;
        }

        // 默认中心位置（可以设置为用户当前位置或其他默认位置）
        const defaultCenter = { lat: 40.7128, lng: -74.0060 }; // 纽约市
        
        // 创建地图实例
        this.map = new google.maps.Map(mapElement, {
          center: defaultCenter,
          zoom: 13,
          mapTypeControl: true,
          streetViewControl: true,
          fullscreenControl: true,
          zoomControl: true,
          gestureHandling: 'greedy', // 允许单手操作
        });

      // 创建地理编码器
      this.geocoder = new google.maps.Geocoder();

      // 创建Places服务
      this.placesService = new google.maps.places.PlacesService(this.map);

      // 创建标记
      this.marker = new google.maps.Marker({
        position: defaultCenter,
        map: this.map,
        draggable: true,
        title: "拖拽选择位置",
        animation: google.maps.Animation.DROP
      });

        // 监听地图点击事件
        this.map.addListener('click', (event) => {
          this.handleMapClick(event.latLng);
        });

        // 监听标记拖拽事件
        this.marker.addListener('dragend', (event) => {
          this.handleMarkerDrag(event.latLng);
        });

        // 初始化时获取默认位置的地址信息
        this.getAddressFromLatLng(defaultCenter);

      console.log('Google Maps初始化成功');

    } catch (error) {
      console.error('Google Maps创建失败:', error);
      this.$message.error('地图创建失败: ' + error.message);
    }
  },

  // 搜索位置
  searchLocation() {
    if (!this.searchKeyword.trim()) {
      this.$message.warning('请输入搜索关键词');
      return;
    }

    if (!this.geocoder) {
      this.$message.error('地图服务未初始化');
      return;
    }

    this.searchLoading = true;

    // 使用地理编码器搜索位置
    this.geocoder.geocode({
      address: this.searchKeyword,
      region: 'cn' // 优先搜索中国地区
    }, (results, status) => {
      this.searchLoading = false;

      if (status === 'OK' && results && results.length > 0) {
        const location = results[0].geometry.location;
        const latLng = { lat: location.lat(), lng: location.lng() };

        // 移动地图到搜索结果位置
        this.map.panTo(latLng);
        this.map.setZoom(15);

        // 更新标记位置
        this.marker.setPosition(latLng);

        // 获取地址信息
        this.getAddressFromLatLng(latLng);

        this.$message.success('搜索成功');
      } else {
        console.error('搜索失败:', status);
        this.$message.error('搜索失败，请检查关键词或网络连接');
      }
    });
  },

    // 处理地图点击事件
    handleMapClick(latLng) {
      const lat = latLng.lat();
      const lng = latLng.lng();
      
      // 更新标记位置
      this.marker.setPosition(latLng);
      
      // 更新地图中心
      this.map.panTo(latLng);
      
      // 获取地址信息
      this.getAddressFromLatLng({ lat, lng });
    },

    // 处理标记拖拽事件
    handleMarkerDrag(latLng) {
      const lat = latLng.lat();
      const lng = latLng.lng();
      
      // 更新地图中心
      this.map.panTo(latLng);
      
      // 获取地址信息
      this.getAddressFromLatLng({ lat, lng });
    },

    // 根据经纬度获取地址信息
    getAddressFromLatLng(latLng) {
      if (!this.geocoder) {
        console.error('地理编码器未初始化');
        this.selectedAddress = '地理编码器未初始化';
        this.selectedLatitude = latLng.lat.toFixed(6);
        this.selectedLongitude = latLng.lng.toFixed(6);
        return;
      }

      this.geocoder.geocode({ location: latLng }, (results, status) => {
        if (status === 'OK' && results && results[0]) {
          this.selectedAddress = results[0].formatted_address;
          this.selectedLatitude = latLng.lat.toFixed(6);
          this.selectedLongitude = latLng.lng.toFixed(6);
          console.log('地址解析成功:', results[0].formatted_address);
        } else {
          console.error('地理编码失败:', status);
          this.selectedAddress = '无法获取地址信息';
          this.selectedLatitude = latLng.lat.toFixed(6);
          this.selectedLongitude = latLng.lng.toFixed(6);
        }
      });
    },

    // 确认位置选择
    confirmLocation() {
      if (this.selectedAddress && this.selectedLatitude && this.selectedLongitude) {
        // 将选择的位置信息保存到表单中
        this.form.merchantAddress = this.selectedAddress;
        this.form.latitude = this.selectedLatitude;
        this.form.longitude = this.selectedLongitude;
        
        this.$message.success('位置选择成功');
        this.closeMapDialog();
      } else {
        this.$message.warning('请先在地图上选择位置');
      }
    },

    // 关闭地图弹窗
    closeMapDialog() {
      this.openMap = false;
      this.resetMapData();
    },

  // 重置地图数据
  resetMapData() {
    // 重置地图数据
    this.selectedAddress = '';
    this.selectedLatitude = '';
    this.selectedLongitude = '';
    this.mapLoading = false;
    this.searchKeyword = '';
    this.searchLoading = false;
    
    // 清理地图实例
    this.cleanupMap();
  },

    // 清理地图实例
    cleanupMap() {
      try {
        if (this.marker) {
          this.marker.setMap(null);
          this.marker = null;
        }
        if (this.map) {
          // 清除地图事件监听器
          google.maps.event.clearInstanceListeners(this.map);
          this.map = null;
        }
        if (this.geocoder) {
          this.geocoder = null;
        }
        this.placesService = null;
        console.log('地图实例已清理');
      } catch (error) {
        console.error('清理地图实例时出错:', error);
      }
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
        merchantName: null,
        logo: null,
        shopImg: null,
        merchantDesc: null,
        merchantAddress: null,
        ein: null,
        legalPerCard: null,
        merchantType: null,
        accountName: null,
        bankAccount: null,
        openingBank: null,
        openingBankAddr: null,
        businessLicense: null,
        permitLicense: null,
        status: null,
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
      this.isAudit = false
      this.open = true
      this.title = "添加商家"
      this.form.password = this.initPassword
    },
    /** 修改按钮操作 */
    handleUpdate(row) {
      this.reset()
      const id = row.id || this.ids
      getMerchant(id).then(response => {
        this.form = response.data
        this.isAudit = false
        this.open = true
        this.title = "修改商家"
      })
    },
    /**
     * 审核按钮操作
     * @param {*} row 
     */
    handleAudit(row){
      this.reset()
      const id = row.id || this.ids
      getMerchant(id).then(response => {
        this.form = response.data
        this.isAudit = true
        this.open = true
        this.auditStatus = 3
        this.title = "商家审核"
      })
    },
    /**
     * 打开操作日志
     */
    showLogs(row){
      const id = row.id || this.ids
      this.logList = []
      listLog({merchantId: id}).then(response => {
        this.logList = response.rows
        this.showLog = true
      })
      
    },
    // 更多操作触发
    handleCommand(command, row) {
      switch (command) {
        case "handleShowLogs":
          this.showLogs(row)
          break
        default:
          break
      }
    },
    /** 提交按钮 */
    submitForm() {
      this.$refs["form"].validate(valid => {
        if (valid) {
          if (this.form.id != null) {
            this.form.status = 1
            updateMerchant(this.form).then(response => {
              this.$modal.msgSuccess("修改成功")
              this.open = false
              this.getList()
            })
          } else {
            addMerchant(this.form).then(response => {
              this.$modal.msgSuccess("新增成功")
              this.open = false
              this.getList()
            })
          }
        }
      })
    },
    /**
     * 提交审核
     */
    submitAuditForm(){
      console.log(this.auditStatus)
      if(this.form.id){
        if(this.auditStatus == 2){
          if(!this.form.reason){
            this.$modal.msgError("请输入拒绝原因")
            return false;
          }
        }
        var _data = {
          id: this.form.id,
          status: this.auditStatus,
          reason: this.form.reason,
          userId: this.form.userId
        }
        auditMerchant(_data).then(response => {
          this.$modal.msgSuccess("操作成功")
          this.open = false
          this.getList()
        })
      }
    },
    /** 删除按钮操作 */
    handleDelete(row) {
      const ids = row.id || this.ids
      this.$modal.confirm('是否确认删除商户编号为"' + ids + '"的数据项？').then(function() {
        return delMerchant(ids)
      }).then(() => {
        this.getList()
        this.$modal.msgSuccess("删除成功")
      }).catch(() => {})
    },
    /** 导出按钮操作 */
    handleExport() {
      this.download('system/merchant/export', {
        ...this.queryParams
      }, `merchant_${new Date().getTime()}.xlsx`)
    },
    handleUploadSuccess(_url, _flag){
      console.log("图片上传回执")
      if(_flag == 1){
        this.form.logo = _url
      }else if(_flag == 2){
        this.form.shopImg = _url
      }else if(_flag == 3){
        this.form.businessLicense = _url
      }else if(_flag == 4){
        this.form.permitLicense = _url
      }
    },
    handleAvatarSuccess(res, file, _flag) {
      if(res.code == 200){
        //this.imageUrl = res.data
        if(_flag == 1){
          this.form.logo = res.data
        }else if(_flag == 2){
          this.form.shopImg = res.data
        }else if(_flag == 3){
          this.form.businessLicense = res.data
        }else if(_flag == 4){
          this.form.permitLicense = res.data
        }
        console.log("上传结果");
        console.log(res);
        this.$message.success("上传成功")
      }else{
        this.$message.error("上传失败")
      }
    },
    beforeAvatarUpload(file) {
      const isJPG = (file.type === 'image/jpeg' || file.type === 'image/png' || file.type === 'image/jpg');
      const isLt2M = file.size / 1024 / 1024 < 2;

      if (!isJPG) {
        this.$message.error('上传头像图片只能是 JPG、PNG、JPEG 格式!');
      }
      if (!isLt2M) {
        this.$message.error('上传头像图片大小不能超过 2MB!');
      }
      return isJPG && isLt2M;
    },
  }
}
</script>
<style scoped>
::v-deep .el-textarea__inner{
  height: 120px;
}
::v-deep .lon-txt .el-form-item__label{
  width: 241px !important;
}
::v-deep .lon-txt .el-form-item__content{
  margin-left: 241px !important;
  /* width: 400px !important; */
}
</style>