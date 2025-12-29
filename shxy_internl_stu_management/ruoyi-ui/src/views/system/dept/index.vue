<template>
  <div class="app-container">
    <el-form :model="queryParams" ref="queryForm" size="small" :inline="true" v-show="showSearch">
      <el-form-item label="学校名称" prop="deptName">
        <el-input
          v-model="queryParams.deptName"
          placeholder="请输入学校名称"
          clearable
          @keyup.enter.native="handleQuery"
        />
      </el-form-item>
      <el-form-item label="状态" prop="status">
        <el-select v-model="queryParams.status" placeholder="学校状态" clearable>
          <el-option
            v-for="dict in dict.type.sys_normal_disable"
            :key="dict.value"
            :label="dict.label"
            :value="dict.value"
          />
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
          @click="handleAddAll"
          v-hasPermi="['system:dept:add']"
        >新增</el-button>
      </el-col>
      <el-col :span="1.5">
        <el-button
          type="info"
          plain
          icon="el-icon-sort"
          size="mini"
          @click="toggleExpandAll"
        >展开/折叠</el-button>
      </el-col>
      <right-toolbar :showSearch.sync="showSearch" @queryTable="getList"></right-toolbar>
    </el-row>

    <el-table
      v-if="refreshTable"
      v-loading="loading"
      :data="deptList"
      row-key="deptId"
      :default-expand-all="isExpandAll"
      :tree-props="{children: 'children', hasChildren: 'hasChildren'}"
    >
      <el-table-column prop="deptName" label="学校中文名称 / 部门名称" width="260"></el-table-column>
      <el-table-column prop="engName" label="学校英文名称" width="260"></el-table-column>
      <el-table-column prop="aprName" label="学校简称" width="100"></el-table-column>
      <el-table-column label="LGOG" align="center" prop="icon" >
        <template slot-scope="scope">
          <img :src="scope.row.logo" style="height: 60px;"/>
        </template>
      </el-table-column>
      <el-table-column prop="orderNum" label="排序" width="80"></el-table-column>
      <el-table-column prop="status" label="状态" width="80">
        <template slot-scope="scope">
          <dict-tag :options="dict.type.sys_normal_disable" :value="scope.row.status"/>
        </template>
      </el-table-column>
      <el-table-column label="创建时间" align="center" prop="createTime" width="150">
        <template slot-scope="scope">
          <span>{{ parseTime(scope.row.createTime) }}</span>
        </template>
      </el-table-column>
      <el-table-column label="操作" align="center" class-name="small-padding fixed-width">
        <template slot-scope="scope">
          <el-button
            v-if="scope.row.parentId == 1"
            size="mini"
            type="text"
            icon="el-icon-edit"
            @click="handleUpdateAll(scope.row)"
            v-hasPermi="['system:dept:edit']"
          >修改</el-button>
          <el-button
            v-else
            size="mini"
            type="text"
            icon="el-icon-edit"
            @click="handleUpdate(scope.row)"
            v-hasPermi="['system:dept:edit']"
          >修改</el-button>
          <el-button
            size="mini"
            type="text"
            icon="el-icon-plus"
            @click="handleAdd(scope.row)"
            v-if="scope.row.parentId == 1"
            v-hasPermi="['system:role:admin', 'system:role:manage']"
          >添加部门</el-button>
          <el-button
            v-if="scope.row.parentId != 0"
            size="mini"
            type="text"
            icon="el-icon-delete"
            @click="handleDelete(scope.row)"
            v-hasPermi="['system:dept:remove']"
          >删除</el-button>
        </template>
      </el-table-column>
    </el-table>

    <!-- 添加第一层学校对话框 -->
    <el-dialog :title="title" :visible.sync="openAll" width="900px" append-to-body>
      <el-form ref="form" :model="form" :rules="rules" label-width="80px">
        <!-- <el-row v-hasPermi="['system:role:admin']">
          <el-col :span="24" v-if="form.parentId !== 0">
            <el-form-item label="上级部门" prop="parentId">
              <treeselect v-model="form.parentId" :options="deptOptions" :normalizer="normalizer" placeholder="选择上级部门" />
            </el-form-item>
          </el-col>
        </el-row> -->
        <el-form-item label="LOGO" prop="icon">
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
        <el-row>
          <el-col class="dept-name-area">
            <el-form-item label="学校中文名称" prop="deptName">
              <el-input v-model="form.deptName" placeholder="请输入学校中文名称" maxlength="100"/>
            </el-form-item>
          </el-col>
        </el-row>
        <el-row>
          <el-col class="dept-name-area">
            <el-form-item label="学校英文名称" prop="engName">
              <el-input v-model="form.engName" placeholder="请输入学校英文名称" maxlength="100"/>
            </el-form-item>
          </el-col>
        </el-row>
        <el-row>
          <el-col class="dept-name-area">
            <el-form-item label="学校简称" prop="aprName">
              <el-input v-model="form.aprName" placeholder="请输入学校简称" maxlength="50"/>
            </el-form-item>
          </el-col>
        </el-row>
        <el-row>
          <el-col class="dept-name-area">
            <el-form-item label="邮箱后缀" prop="mailDomain">
              <el-input v-model="form.mailDomain" placeholder="请输入学校邮箱后缀" maxlength="50"/>
            </el-form-item>
          </el-col>
        </el-row>
        <el-row>
          <el-col :span="12">
            <el-form-item label="学校状态">
              <el-radio-group v-model="form.status">
                <el-radio
                  v-for="dict in dict.type.sys_normal_disable"
                  :key="dict.value"
                  :label="dict.value"
                >{{dict.label}}</el-radio>
              </el-radio-group>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="显示排序" prop="orderNum">
              <el-input-number v-model="form.orderNum" controls-position="right" :min="0" />
            </el-form-item>
          </el-col>
        </el-row>

        <el-form-item label="学校介绍" prop="detail">
          
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
        </el-form-item>

        <!-- <el-row>
          <el-col :span="12">
            <el-form-item label="负责人" prop="leader">
              <el-input v-model="form.leader" placeholder="请输入负责人" maxlength="20" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="联系电话" prop="phone">
              <el-input v-model="form.phone" placeholder="请输入联系电话" maxlength="11" />
            </el-form-item>
          </el-col>
        </el-row>
        <el-row>
          <el-col :span="12">
            <el-form-item label="邮箱" prop="email">
              <el-input v-model="form.email" placeholder="请输入邮箱" maxlength="50" />
            </el-form-item>
          </el-col>
        </el-row> -->
      </el-form>
      <div slot="footer" class="dialog-footer">
        <el-button type="primary" @click="submitForm">确 定</el-button>
        <el-button @click="cancel">取 消</el-button>
      </div>
    </el-dialog>

    <!-- 添加或修改部门对话框 -->
    <el-dialog :title="title" :visible.sync="open" width="600px" append-to-body>
      <el-form ref="form" :model="form" :rules="rules" label-width="80px">
        <el-row v-hasPermi="['system:role:admin']">
          <el-col :span="24" v-if="form.parentId !== 0" class="dept-name-area">
            <el-form-item label="上级部门" prop="parentId">
              <treeselect v-model="form.parentId" :options="deptOptions" :normalizer="normalizer" placeholder="选择上级部门" />
            </el-form-item>
          </el-col>
        </el-row>
        <el-row>
          <el-col >
            <el-form-item label="部门名称" prop="deptName">
              <el-input v-model="form.deptName" placeholder="请输入部门名称" />
            </el-form-item>
          </el-col>
        </el-row>
        <el-row>
          <el-col :span="12">
            <el-form-item label="学校状态">
              <el-radio-group v-model="form.status">
                <el-radio
                  v-for="dict in dict.type.sys_normal_disable"
                  :key="dict.value"
                  :label="dict.value"
                >{{dict.label}}</el-radio>
              </el-radio-group>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="显示排序" prop="orderNum">
              <el-input-number v-model="form.orderNum" controls-position="right" :min="0" />
            </el-form-item>
          </el-col>
        </el-row>
        <!-- <el-row>
          <el-col :span="12">
            <el-form-item label="负责人" prop="leader">
              <el-input v-model="form.leader" placeholder="请输入负责人" maxlength="20" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="联系电话" prop="phone">
              <el-input v-model="form.phone" placeholder="请输入联系电话" maxlength="11" />
            </el-form-item>
          </el-col>
        </el-row>
        <el-row>
          <el-col :span="12">
            <el-form-item label="邮箱" prop="email">
              <el-input v-model="form.email" placeholder="请输入邮箱" maxlength="50" />
            </el-form-item>
          </el-col>
        </el-row> -->
      </el-form>
      <div slot="footer" class="dialog-footer">
        <el-button type="primary" @click="submitPartForm">确 定</el-button>
        <el-button @click="cancel">取 消</el-button>
      </div>
    </el-dialog>
  </div>
</template>

<script>
import { listDept, getDept, delDept, addDept, updateDept, listDeptExcludeChild } from "@/api/system/dept"
import Treeselect from "@riophae/vue-treeselect"
import "@riophae/vue-treeselect/dist/vue-treeselect.css"
import {quillEditor} from 'vue-quill-editor'
import 'quill/dist/quill.core.css'
import 'quill/dist/quill.snow.css'
import 'quill/dist/quill.bubble.css'

export default {
  name: "Dept",
  dicts: ['sys_normal_disable'],
  components: { Treeselect, quillEditor},
  data() {
    return {
      // 遮罩层
      loading: true,
      // 显示搜索条件
      showSearch: true,
      // 表格树数据
      deptList: [],
      // 部门树选项
      deptOptions: [],
      // 弹出层标题
      title: "",
      // 是否显示弹出层
      open: false,
      openAll: false,
      selectRowId: -1,
      // 是否展开，默认全部展开
      isExpandAll: true,
      // 重新渲染表格状态
      refreshTable: true,
      // 查询参数
      queryParams: {
        deptName: undefined,
        status: undefined
      },
      // 表单参数
      form: {},
      imageUrl: '',
      serverUrl: process.env.VUE_APP_FILE_SERVER_URL, // 这里写你要上传的图片服务器地址http://localhost:8080
      uploadHeaders: {
      }, 
      // 表单校验
      rules: {
        parentId: [
          { required: true, message: "上级学校不能为空", trigger: "blur" }
        ],
        deptName: [
          { required: true, message: "学校名称不能为空", trigger: "blur" }
        ],
        orderNum: [
          { required: true, message: "显示排序不能为空", trigger: "blur" }
        ],
        email: [
          {
            type: "email",
            message: "请输入正确的邮箱地址",
            trigger: ["blur", "change"]
          }
        ],
        phone: [
          {
            pattern: /^1[3|4|5|6|7|8|9][0-9]\d{8}$/,
            message: "请输入正确的手机号码",
            trigger: "blur"
          }
        ]
      },
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
    }
  },
  created() {
    this.getList()
  },
  methods: {
    /** 查询部门列表 */
    getList() {
      this.loading = true
      listDept(this.queryParams).then(response => {
        this.deptList = this.handleTree(response.data, "deptId")
        this.loading = false
      })
    },
    /** 转换部门数据结构 */
    normalizer(node) {
      if (node.children && !node.children.length) {
        delete node.children
      }
      return {
        id: node.deptId,
        label: node.deptName,
        children: node.children
      }
    },
    // 取消按钮
    cancel() {
      this.open = false
      this.openAll = false
      this.reset()
    },
    // 表单重置
    reset() {
      this.form = {
        deptId: undefined,
        parentId: undefined,
        deptName: undefined,
        orderNum: undefined,
        leader: undefined,
        phone: undefined,
        email: undefined,
        logo: undefined,
        engName: undefined,
        aprName: undefined,
        status: "0",
        detail: undefined
      }
      this.imageUrl= ""
      this.resetForm("form")
    },
    /** 搜索按钮操作 */
    handleQuery() {
      this.getList()
    },
    /** 重置按钮操作 */
    resetQuery() {
      this.resetForm("queryForm")
      this.handleQuery()
    },
    /** 顶部新增按钮操作 */
    handleAddAll(row) {
      this.reset()
      if (row != undefined) {
        this.form.parentId = row.deptId
      }
      this.openAll = true
      this.title = "添加学校"
      listDept().then(response => {
        this.deptOptions = this.handleTree(response.data, "deptId")
      })
    },
    /** 新增按钮操作 */
    handleAdd(row) {
      this.reset()
      if (row != undefined) {
        this.form.parentId = row.deptId
      }
      this.open = true
      this.title = "添加部门"
      listDept().then(response => {
        this.deptOptions = this.handleTree(response.data, "deptId")
      })
    },
    /** 展开/折叠操作 */
    toggleExpandAll() {
      this.refreshTable = false
      this.isExpandAll = !this.isExpandAll
      this.$nextTick(() => {
        this.refreshTable = true
      })
    },
    /** 修改学校按钮操作 */
    handleUpdateAll(row) {
      this.reset()
      getDept(row.deptId).then(response => {
        this.form = response.data
        this.imageUrl = response.data.logo
        this.openAll = true
        this.title = "修改学校"
        listDeptExcludeChild(row.deptId).then(response => {
          this.deptOptions = this.handleTree(response.data, "deptId")
          if (this.deptOptions.length == 0) {
            const noResultsOptions = { deptId: this.form.parentId, deptName: this.form.parentName, children: [] }
            this.deptOptions.push(noResultsOptions)
          }
        })
      })
    },
    /** 修改按钮操作 */
    handleUpdate(row) {
      this.reset()
      getDept(row.deptId).then(response => {
        this.form = response.data
        this.open = true
        this.title = "修改部门"
        listDeptExcludeChild(row.deptId).then(response => {
          this.deptOptions = this.handleTree(response.data, "deptId")
          if (this.deptOptions.length == 0) {
            const noResultsOptions = { deptId: this.form.parentId, deptName: this.form.parentName, children: [] }
            this.deptOptions.push(noResultsOptions)
          }
        })
      })
    },
    /** 提交按钮 学校*/
    submitForm: function() {
      console.log("parentId=",this.form.parentId)
      if(this.deptList.length > 0 && (!this.form.parentId || this.form.parentId == '')){
        this.form.parentId = 1 //this.deptList[0].deptId
      }
      if(this.imageUrl){
        this.form.logo = this.imageUrl
      }
      this.$refs["form"].validate(valid => {
        if (valid) {
          if (this.form.deptId != undefined) {
            updateDept(this.form).then(response => {
              this.$modal.msgSuccess("修改成功")
              this.open = false
              this.openAll = false
              this.imageUrl= ""
              this.getList()
            })
          } else {
            addDept(this.form).then(response => {
              this.$modal.msgSuccess("新增成功")
              this.open = false
              this.openAll = false
              this.imageUrl= ""
              this.getList()
            })
          }
        }
      })
    },
    /** 提交按钮 部门*/
    submitPartForm: function() {
      console.log("form=",this.form)
      /* if(this.deptList.length > 0 && (!this.form.parentId || this.form.parentId == '')){
        this.form.parentId = 1 //this.deptList[0].deptId
      } */
      this.$refs["form"].validate(valid => {
        if (valid) {
          if (this.form.deptId != undefined) {
            updateDept(this.form).then(response => {
              this.$modal.msgSuccess("修改成功")
              this.open = false
              this.openAll = false
              this.getList()
            })
          } else {
            addDept(this.form).then(response => {
              this.$modal.msgSuccess("新增成功")
              this.open = false
              this.openAll = false
              this.getList()
            })
          }
        }
      })
    },
    /** 删除按钮操作 */
    handleDelete(row) {
      this.$modal.confirm('是否确认删除名称为"' + row.deptName + '"的数据项？').then(function() {
        return delDept(row.deptId)
      }).then(() => {
        this.getList()
        this.$modal.msgSuccess("删除成功")
      }).catch(() => {})
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
::v-deep .dept-name-area .el-form-item__label{
  width: 110px !important;
}
::v-deep .dept-name-area .el-form-item__content{
  margin-left: 110px !important;
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
    width: 178px;
    height: 178px;
    line-height: 178px;
    text-align: center;
  }
  .avatar {
    width: 178px;
    height: 178px;
    display: block;
  }
   ::v-deep .avatar-out-block .el-upload{
    border: 1px dashed #CCCCCC;
  }
</style>
