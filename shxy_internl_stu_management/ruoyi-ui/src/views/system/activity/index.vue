<template>
  <div class="app-container">
    <el-form :model="queryParams" ref="queryForm" size="small" :inline="true" v-show="showSearch" label-width="68px">
      <el-form-item label="活动名称" prop="name">
        <el-input
          v-model="queryParams.name"
          placeholder="请输入活动名称"
          clearable
          @keyup.enter.native="handleQuery"
        />
      </el-form-item>
      <!-- <el-form-item label="活动开始时间" prop="startTime">
        <el-date-picker clearable
          v-model="queryParams.startTime"
          type="date"
          value-format="yyyy-MM-dd"
          placeholder="请选择活动开始时间">
        </el-date-picker>
      </el-form-item>
      <el-form-item label="活动结束时间" prop="endTime">
        <el-date-picker clearable
          v-model="queryParams.endTime"
          type="date"
          value-format="yyyy-MM-dd"
          placeholder="请选择活动结束时间">
        </el-date-picker>
      </el-form-item> -->
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
          v-hasPermi="['system:activity:add']"
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
          v-hasPermi="['system:activity:edit']"
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
          v-hasPermi="['system:activity:remove']"
        >删除</el-button>
      </el-col>
      <el-col :span="1.5">
        <el-button
          type="warning"
          plain
          icon="el-icon-download"
          size="mini"
          @click="handleExport"
          v-hasPermi="['system:activity:export']"
        >导出</el-button>
      </el-col>
      <right-toolbar :showSearch.sync="showSearch" @queryTable="getList"></right-toolbar>
    </el-row>

    <el-table v-loading="loading" :data="activityList" @selection-change="handleSelectionChange">
      <el-table-column type="selection" width="55" align="center" />
      <!-- <el-table-column label="活动ID" align="center" prop="id" /> -->
      <el-table-column label="活动名称" align="center" prop="name" />
      <el-table-column label="展示图" align="center" prop="icon" >
        <template slot-scope="scope">
          <img :src="scope.row.icon" style="height: 60px;"/>
        </template>
      </el-table-column>
      <el-table-column label="活动时间" align="center" prop="startTime" width="200">
        <template slot-scope="scope">
          <div style="display: flex; flex-direction: column;">
            <span style="line-height: normal;">{{ scope.row.startTime }}</span>
            <span style="line-height: normal;">~</span>
            <span style="line-height: normal;">{{ scope.row.endTime}}</span>
          </div>  
        </template>
      </el-table-column>
      <el-table-column label="报名时间" align="center" prop="endTime" width="200">
        <template slot-scope="scope">
          <div style="display: flex; flex-direction: column;">
              <span style="line-height: normal;">{{ scope.row.signStartTime }}</span>
              <span style="line-height: normal;">~</span>
              <span style="line-height: normal;">{{ scope.row.signEndTime }}</span>
          </div>
        </template>
      </el-table-column>
      <el-table-column label="人数" align="center" >
        <template slot-scope="scope">
          <span>{{scope.row.registerCount + '/' + (scope.row.enrollment == 0 || scope.row.enrollment == null ? '∞' : scope.row.enrollment)}}</span>
        </template>
      </el-table-column>
      <el-table-column label="费用(美元)" align="center" prop="price">
        <template slot-scope="scope">
          <span v-if="scope.row.price">{{scope.row.price}}</span>
          <span v-else>0</span>
        </template>
      </el-table-column>
      <el-table-column label="可获积分" align="center" prop="point">
        <template slot-scope="scope">
          <span v-if="scope.row.point">{{scope.row.point}}</span>
          <span v-else>0</span>
        </template>
      </el-table-column>
      <!-- <el-table-column label="状态" align="center" prop="status" /> -->
      <el-table-column label="是否可用" align="center" prop="enabled" >
        <template slot-scope="scope">
          <span v-if="scope.row.enabled == 1">启用</span>
          <span v-if="scope.row.enabled == -1">停用</span>
        </template>
      </el-table-column>
      <el-table-column label="创建人" align="center" prop="createName" />
      <el-table-column label="所属学校" align="center" prop="deptName" />
      <el-table-column label="操作" align="center" class-name="small-padding fixed-width">
        <template slot-scope="scope">
          <el-button
            size="mini"
            type="text"
            icon="el-icon-edit"
            @click="handleUpdate(scope.row)"
            v-hasPermi="['system:activity:edit']"
          >修改</el-button>
          <el-button
            size="mini"
            type="text"
            icon="el-icon-delete"
            @click="handleDelete(scope.row)"
            v-hasPermi="['system:activity:remove']"
          >删除</el-button>
          <el-dropdown size="mini" @command="(command) => handleCommand(command, scope.row)" v-hasPermi="['system:user:resetPwd', 'system:actExUser:query']">
            <el-button size="mini" type="text" icon="el-icon-d-arrow-right">更多</el-button>
            <el-dropdown-menu slot="dropdown">
              <el-dropdown-item command="handleActivitySignPage" v-hasPermi="['system:actExUser:query']">报名列表</el-dropdown-item>
              <el-dropdown-item command="handleQrcode" v-hasPermi="['system:actExUser:query']">活动二维码</el-dropdown-item>
            </el-dropdown-menu>
          </el-dropdown>
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

    <!-- 添加或修改活动对话框 -->
    <el-dialog :title="title" :visible.sync="open" width="1000px" append-to-body>
      <el-form ref="form" :model="form" :rules="rules" label-width="80px">
        <el-row>
          <el-col :span="12">
            <el-form-item label="活动名称" prop="name">
              <el-input v-model="form.name" placeholder="请输入活动名称" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="活动地点" prop="address">
              <el-input v-model="form.address" placeholder="请输入活动地点" />
            </el-form-item>
          </el-col>
        </el-row>
        <el-row>
          <el-col :span="12">
            <el-form-item label="活动时间" prop="startTime">
              <el-date-picker
                v-model="actTime"
                type="datetimerange"
                range-separator="至"
                start-placeholder="开始日期"
                end-placeholder="结束日期"
                format="yyyy-MM-dd HH:mm:ss"
                value-format="yyyy-MM-dd HH:mm:ss"
                >
              </el-date-picker>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="报名时间" prop="signStartTime">
              <el-date-picker
                v-model="signTime"
                type="datetimerange"
                range-separator="至"
                start-placeholder="开始日期"
                end-placeholder="结束日期"
                format="yyyy-MM-dd HH:mm:ss"
                value-format="yyyy-MM-dd HH:mm:ss"
                >
              </el-date-picker>
            </el-form-item>
          </el-col>
        </el-row>
        <el-row>
          <el-col :span="12">
            <el-form-item label="时区" prop="enrollment">
              <el-select v-model="form.timeZone" clearable placeholder="请选择时区">
                <el-option
                  v-for="item in options"
                  :key="item.value"
                  :label="item.value"
                  :value="item.value">
                </el-option>
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="报名人数" prop="enrollment">
              <el-input v-model="form.enrollment" placeholder="请输入报名人数" />
            </el-form-item>
          </el-col>
        </el-row>
        <el-row>
          <el-col :span="12">
            <el-form-item label="活动类型" prop="actType">
              <el-select v-model="form.actType" clearable placeholder="请选择">
                <el-option
                  v-for="item in actTypeList"
                  :key="item.value"
                  :label="item.label"
                  :value="item.value">
                </el-option>
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="活动费用" prop="price">
              <el-input v-model="form.price" placeholder="请输入活动费用">
                <template slot="append">美元</template>
              </el-input>
            </el-form-item>
          </el-col>
        </el-row>
        <el-row>
          <el-col :span="12">
            <el-form-item label="状态">
              <el-radio-group v-model="form.enabled">
                <el-radio :label="1">正常</el-radio>
                <el-radio :label="-1">停用</el-radio>
              </el-radio-group>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="积分" prop="point">
              <el-input v-model="form.point" placeholder="请输入参与活动可得积分">
              </el-input>
            </el-form-item>
          </el-col>
        </el-row>
        <el-row>
          <el-col :span="12">
            <el-form-item label="表单模板" prop="modelId">
              <el-select v-model="form.modelId" clearable placeholder="请选择">
                <el-option
                  v-for="item in modelList"
                  :key="item.id"
                  :label="item.name"
                  :value="item.id">
                </el-option>
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="相关学校" prop="deptIdArr">
              <el-select v-model="form.deptIdArr" multiple clearable placeholder="请选择">
                <el-option
                  v-for="item in schoolList"
                  :key="item.deptId"
                  :label="item.deptName"
                  :value="item.deptId">
                </el-option>
              </el-select>
            </el-form-item>
          </el-col>
        </el-row>
        <el-row>
          <el-col :span="12">
            <el-form-item label="展示图" prop="icon">
              <el-upload
                class="avatar-uploader"
                :action="serverUrl"
                :show-file-list="false"
                :on-success="handleAvatarSuccess"
                :before-upload="beforeAvatarUpload"
                :class="imageUrl ? '' : 'avatar-out-block'"
                >
                <img v-if="imageUrl" :src="imageUrl" class="avatar">
                <i v-else class="el-icon-plus avatar-uploader-icon"></i>
              </el-upload>
            </el-form-item>
          </el-col>
          <el-col :span="12"></el-col>
        </el-row>
        <el-form-item label="活动详情" prop="detail">
          
          <el-upload class="avatar-uploader quill-img" name="file" 
            :action="serverUrl" 
            :show-file-list="false" 
            :headers="uploadHeaders" 
            :on-success="quillImgSuccess" 
            :before-upload="quillImgBefore" 
            accept='.jpg,.jpeg,.png,.gif'>
          </el-upload>
          <quill-editor 
          v-model="form.detail" 
          :options="editorOption" 
          style="height: 420px;"
          ref="myTextEditor"
          />
          <!-- <mavon-editor v-model="form.descriptionGoods"/> -->
        </el-form-item>
      </el-form>
      <div slot="footer" class="dialog-footer">
        <el-button type="primary" @click="submitForm">确 定</el-button>
        <el-button @click="cancel">取 消</el-button>
      </div>
    </el-dialog>

    <!-- 二维码 -->
    <el-dialog title="活动二维码" :visible.sync="isShowQrcode" width="500px" append-to-body style="margin-top: 12vh !important;">
        <div style="display: flex; flex-direction: column; align-items: center; justify-content: center;">
          <div style="font-size: 1.2rem; font-weight: 550; margin-top: 1rem;">{{currActivityId}}</div>
          <img :src="qrcodeUrl" style="width: 400px;"/>
        </div>
    </el-dialog>

  </div>
</template>

<script>
import { listActivity, getActivity, delActivity, addActivity, updateActivity, listModel, listSchool } from "@/api/system/activity"
import {quillEditor} from 'vue-quill-editor'
import 'quill/dist/quill.core.css'
import 'quill/dist/quill.snow.css'
import 'quill/dist/quill.bubble.css'
import QRCode from 'qrcode';
import CryptoJS from 'crypto-js'
export default {
  name: "Activity",
  components:{
    quillEditor
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
      // 活动表格数据
      activityList: [],
      schoolList: [],
      // 弹出层标题
      title: "",
      // 是否显示弹出层
      open: false,
      // 二维码弹层
      isShowQrcode: false,
      qrcodeUrl: '',
      // 查询参数
      queryParams: {
        pageNum: 1,
        pageSize: 10,
        name: null,
        icon: null,
        startTime: null,
        endTime: null,
        address: null,
        enrollment: null,
        detail: null,
        signStartTime: null,
        signEndTime: null,
        status: null,
        enabled: null,
        signTime: null,
        actTime: null
      },
      signTime: [],
      actTime: [],
      // 表单参数
      form: {},
      // 表单校验
      rules: {
        actType: [
          { required: true, message: "请选择活动类型" }
        ],
        price: [
          { required: true, message: "费用不能为空", trigger: "blur" },
          { pattern: /^\d+(\.\d{1,2})?$/, message: "费用格式不正确", trigger: "blur" }
        ],
        point: [
          { required: true, message: "请输入参与活动可得积分", trigger: "blur" },
          { pattern: /^\d+(\.\d{1,2})?$/, message: "积分格式不正确", trigger: "blur" }
        ],
        deptIdArr: [
          { required: true, message: "请选择学校" }
        ],
      },
      actTypeList: [
        {
          label: '社交活动 (Social)',
          value: 1
        },
        {
          label: '节日庆典 (Festival)',
          value: 2
        },
        {
          label: '生活服务 (Service)',
          value: 3
        },
        {
          label: '志愿服务 (Volunteer)',
          value: 4
        },
        {
          label: '学术活动 (Academic)',
          value: 5
        },
        {
          label: '职业发展 (Career)',
          value: 6
        }
      ],
      modelList: [],//表单模板列表
      options: [
        {
          value: '美东部时区(Eastern Time, ET)',
        }, {
          value: '美中部时区(Central Time, CT)',
        }, {
          value: '美山地时区(Mountain Time, MT)',
        }, {
          value: '太平洋时区(Pacific Time, PT)',
        }
      ],
      editorOption: {
          modules: {
              toolbar: {
                  container: [
                      ['bold', 'italic', 'underline', 'strike'],
                      ['blockquote'],
                      [
                          {
                              header: 1
                          },
                          {
                              header: 2
                          }
                      ],
                      [
                          {
                              list: 'ordered'
                          },
                          {
                              list: 'bullet'
                          }
                      ],
                      [
                          {
                              indent: '-1'
                          },
                          {
                              indent: '+1'
                          }
                      ],
                      [
                          {
                              direction: 'rtl'
                          }
                      ],
                      [
                          {
                              size: ['small', false, 'large', 'huge']
                          }
                      ],
                      [
                          {
                              header: [1, 2, 3, 4, 5, 6, false]
                          }
                      ],
                      [
                          {
                              color: []
                          },
                          {
                              background: []
                          }
                      ],
                      [
                          {
                              font: []
                          }
                      ],
                      [
                          {
                              align: []
                          }
                      ],
                      ['clean'],
                      ['link', 'image', 'video'],
                      ['insertMetric'] //新添加的工具
                  ],
                  handlers: {
                      shadeBox: null,
                      that: this,
                      insertMetric: function () {
                          let self = this.handlers.that;
                          self.showMetric = true;
                          self.quill_this = this;
                      },
                      image: function(val){
                        if(val){
                            document.querySelector('.quill-img input').click()
                        }else{
                          this.quill.format('image', false);
                        }
                      }
                  }
              }
          }
      },
      imageUrl: '',
      serverUrl: process.env.VUE_APP_FILE_SERVER_URL, // 这里写你要上传的图片服务器地址
      uploadHeaders: {
      }, 
      currActivityId: ''
    }
  },
  created() {
    this.getList()
    this.getModelList();
    this.getSchoolList();
  },
  methods: {
    getSimpleDate(date) {
      var y = date.getFullYear();
      var m = date.getMonth() + 1;
      m = m < 10 ? ('0' + m) : m;
      var d = date.getDate();
      d = d < 10 ? ('0' + d) : d;
      var h = date.getHours();
      h = h < 10 ? ('0' + h) : h
      var minute = date.getMinutes();
      minute = minute < 10 ? ('0' + minute) : minute;
      var s = date.getSeconds();
      s = s < 10 ? '0' + s : s;
      return y + '-' + m + '-' + d + ' ' + h + ':' + minute + ':' + s;
    },
    /** 查询活动列表 */
    getList() {
      this.loading = true
      listActivity(this.queryParams).then(response => {
        this.activityList = response.rows
        this.total = response.total
        this.loading = false
      })
    },
    getModelList(){
      listModel({}).then(response => {
        this.modelList = response.rows
      })
    },
    getSchoolList(){
      listSchool({}).then(response => {
        console.log("学校列表", response)
        this.schoolList = response.data
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
        name: null,
        icon: null,
        startTime: null,
        endTime: null,
        address: null,
        enrollment: null,
        detail: null,
        signStartTime: null,
        signEndTime: null,
        status: null,
        enabled: null,
        createTime: null,
        updateTime: null,
        deptIds: null,
        deptIdArr: []
      }
      this.signTime = null
      this.actTime = null
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
      this.form.enabled = 1
      this.form.icon = ""
      this.imageUrl = ''
      this.title = "创建活动"
    },
    /** 修改按钮操作 */
    handleUpdate(row) {
      this.reset()
      const id = row.id || this.ids
      getActivity(id).then(response => {
        this.form = response.data
        console.log(this.form);
        this.signTime = [this.form.signStartTime, this.form.signEndTime]
        this.actTime = [this.form.startTime, this.form.endTime]
        this.open = true
        this.title = "修改活动"
        this.imageUrl = this.form.icon
        var _tempDeptArr = this.form.deptIds ? this.form.deptIds.split(",") : []
        if(_tempDeptArr.length > 0){
          for(var i = 0;i < _tempDeptArr.length; i++){
            _tempDeptArr[i] = parseInt(_tempDeptArr[i])
          }
        }
        this.$set(this.form, "deptIdArr", _tempDeptArr)
        //this.form.deptIdArr = _tempDeptArr
      })
    },
    /** 提交按钮 */
    submitForm() {
      this.$refs["form"].validate(valid => {
        if(this.form.deptIdArr && this.form.deptIdArr.length > 0){
            this.form.deptIds = this.form.deptIdArr.join(',')
        }
        console.log("result=",this.form);
        //return false;
        if (valid) {
          console.log(this.actTime)
          console.log(this.signTime)
          //校验必填字段
          if(this.form.name == null){
            this.$modal.msgError("活动名称不能为空")
            return false;
          }
          if(this.form.address == null){
            this.$modal.msgError("活动地址不能为空")
            return false;
          }
          if(this.actTime == null){
            this.$modal.msgError("请选择活动时间")
            return false;
          }else{
            
            this.form.startTime = this.actTime[0] //this.form.id == null ? this.getSimpleDate(this.form.actTime[0]) : this.form.actTime[0]
            this.form.endTime = this.actTime[1] //this.form.id == null ? this.getSimpleDate(this.form.actTime[1]) : this.form.actTime[1]
          }
          if(this.signTime == null){
            this.$modal.msgError("请选择活动报名时间")
            return false;
          }else{
            this.form.signStartTime = this.signTime[0] //this.form.id == null ? this.getSimpleDate(this.form.signTime[0]) : this.form.signTime[0]
            this.form.signEndTime = this.signTime[1] //this.form.id == null ? this.getSimpleDate(this.form.signTime[1]) : this.form.signTime[1]
          }
          if(this.form.timeZone == null){
            this.$modal.msgError("请选择时区")
            return false;
          }
          if(this.form.enrollment != null && this.form.enrollment != ''){
            if(/^\d+$/.test(this.form.enrollment) && parseInt(this.form.enrollment, 10) >= 0){
              
            }else{
              this.$modal.msgError("报名人数只能输入大于等于0的整数")
              return false;
            }
          }
          if(this.form.detail == null){
            this.$modal.msgError("活动详情不能为空")
            return false;
          }
          console.log(this.form)
          if (this.form.id != null) {
            updateActivity(this.form).then(response => {
              this.$modal.msgSuccess("修改成功")
              this.open = false
              this.imageUrl = "";
              this.form.icon = ""
              this.getList()
            })
          } else {
            addActivity(this.form).then(response => {
              this.$modal.msgSuccess("新增成功")
              this.open = false
              this.imageUrl = "";
              this.form.icon = ""
              this.getList()
            })
          }
        }
      })
    },
    /** 删除按钮操作 */
    handleDelete(row) {
      const ids = row.id || this.ids
      this.$modal.confirm('是否确认删除活动编号为"' + ids + '"的数据项？').then(function() {
        return delActivity(ids)
      }).then(() => {
        this.getList()
        this.$modal.msgSuccess("删除成功")
      }).catch(() => {})
    },
    /** 导出按钮操作 */
    handleExport() {
      this.download('system/activity/export', {
        ...this.queryParams
      }, `activity_${new Date().getTime()}.xlsx`)
    },
    // 更多操作触发
    handleCommand(command, row) {
      switch (command) {
        case "handleActivitySignPage":
          this.handleActivitySignPage(row)
          break
        case "handleQrcode":
          this.handleQrcode(row)
          break;
        default:
          break
      }
    },
    /**
     * 生产活动二维码
     * @param {*} row 
     */
    handleQrcode(row){
      console.log(row)
      // 生成二维码
      var _content = row.id.toString(); 
      QRCode.toDataURL(_content, (err, url) => {
          if (err) console.error(err);
          console.log(url); // 输出二维码图片的URL
          this.qrcodeUrl = url
      });
      this.isShowQrcode = true
      this.currActivityId = _content
    },
    /**
     * 跳转报名列表
     * @param {*} row 
     */
    handleActivitySignPage: function(row) {
      console.log(row)
      const activityId = row.id
      this.$router.push("/system/activity-ex-user/list/" + activityId)
    },
    handleAvatarSuccess(res, file) {
      if(res.code == 200){
        this.imageUrl = res.data
        this.form.icon = res.data
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
    // 富文本编辑框图片上传
		quillImgSuccess(res, file) {
			// 获取富文本组件实例
			let quill = this.$refs.myTextEditor.quill;
      console.log(res);
			// 如果上传成功
			if (res.code == '200') {
				// 获取光标所在位置
				let length = quill.getSelection().index;
				// 插入图片  res.data为服务器返回的图片地址
        quill.insertEmbed(length, 'image', res.data);// 这里的url是图片的访问路径不是真实物理路径
				//quill.insertEmbed(length, 'image', '/static-resource/' + res.body);// 这里的url是图片的访问路径不是真实物理路径
				// 调整光标到最后
				quill.setSelection(length + 1)
			} else {
				this.$message.error('图片上传失败')
			}
		},
    quillImgBefore(file){
			let fileType = file.type;
			if(fileType === 'image/jpeg' || fileType === 'image/png'){
				return true;
			}else {
				this.$message.error('请插入图片类型文件(jpg/jpeg/png)');
				return false;
			}
		},
  }
}
</script>
<style scoped>
::v-deep .el-dialog__footer{
  padding-top: 40px !important;
}
.avatar-uploader .el-upload {
    border: 1px dashed #d9d9d9;
    border-radius: 6px;
    cursor: pointer;
    position: relative;
    overflow: hidden;
  }
  .avatar-uploader .el-upload:hover {
    border-color: #409EFF;
  }
  .avatar-uploader-icon {
    font-size: 28px;
    color: #8c939d;
    width: 316px;
    height: 178px;
    line-height: 178px;
    text-align: center;
  }
  .avatar {
    width: 316px;
    height: 178px;
    display: block;
  }
  ::v-deep .el-table--enable-row-transition .el-table__body td.el-table__cell{
    height: 60px;
    padding: 4px 0 !important;
  }
  ::v-deep .el-table--enable-row-transition .el-table__body td.el-table__cell .cell{
    height: 60px;
    line-height: 60px;
  }
  ::v-deep .avatar-out-block .el-upload{
    border: 1px dashed #CCCCCC;
  }
  ::v-deep .el-select{
    width: 100%;
  }
</style>
