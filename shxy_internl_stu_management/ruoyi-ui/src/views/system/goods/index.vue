<template>
  <div class="app-container">
    <el-form :model="queryParams" ref="queryForm" size="small" :inline="true" v-show="showSearch" label-width="68px">
      <el-form-item label="商品名称" prop="goodName">
        <el-input
          v-model="queryParams.goodName"
          placeholder="请输入商品名称"
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
          v-hasPermi="['system:goods:add']"
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
          v-hasPermi="['system:goods:edit']"
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
          v-hasPermi="['system:goods:remove']"
        >删除</el-button>
      </el-col>
      <el-col :span="1.5">
        <el-button
          type="warning"
          plain
          icon="el-icon-download"
          size="mini"
          @click="handleExport"
          v-hasPermi="['system:goods:export']"
        >导出</el-button>
      </el-col>
      <right-toolbar :showSearch.sync="showSearch" @queryTable="getList"></right-toolbar>
    </el-row>

    <el-table v-loading="loading" :data="goodsList" @selection-change="handleSelectionChange">
      <el-table-column type="selection" width="55" align="center" />
      <!-- <el-table-column label="${comment}" align="center" prop="id" /> -->
      <el-table-column label="商品名称" align="center" prop="goodName" />
      <el-table-column label="商品展示图" align="center" prop="goodIcon">
        <template slot-scope="scope">
          <img :src="scope.row.goodIcon" style="height: 60px;"/>
        </template>
      </el-table-column>
      <el-table-column label="商品所属分类" align="center" prop="classifyName" />
      <el-table-column label="商品简介" align="center" prop="goodDesc" />
      <el-table-column label="商品价格(积分)" align="center" prop="price" />
      <el-table-column label="库存数量" align="center" prop="quantity">
        <template slot-scope="scope">
          <span v-if="scope.row.unit">{{scope.row.quantity + scope.row.unit}}</span>
          <span v-else>{{scope.row.quantity}}</span>
        </template>
      </el-table-column>
      <!-- <el-table-column label="商品详情" align="center" prop="goodDetail" /> -->
      <el-table-column label="操作" align="center" class-name="small-padding fixed-width">
        <template slot-scope="scope">
          <el-button
            size="mini"
            type="text"
            icon="el-icon-edit"
            @click="handleUpdate(scope.row)"
            v-hasPermi="['system:goods:edit']"
          >修改</el-button>
          <el-button
            size="mini"
            type="text"
            icon="el-icon-delete"
            @click="handleDelete(scope.row)"
            v-hasPermi="['system:goods:remove']"
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

    <!-- 添加或修改积分商品对话框 -->
    <el-dialog :title="title" :visible.sync="open" width="1000px" append-to-body>
      <el-form ref="form" :model="form" :rules="rules" label-width="90px">
        <el-form-item label="商品名称" prop="goodName">
          <el-input v-model="form.goodName" placeholder="请输入商品名称" maxlength="50"/>
        </el-form-item>
        <el-form-item label="商品展示图" prop="goodIcon">
          <!-- <el-input v-model="form.goodIcon" type="textarea" placeholder="请输入内容" /> -->
          <BigFileUpload 
            @handleUploadSuccess="handleUploadSuccess"
            :defaultUrl = "form.goodIcon"
            :imgWidth="120"
            :imgHeight="120"
          />
        </el-form-item>
        <el-form-item label="选择分类" prop="classifyId">
          <el-select v-model="form.classifyId" placeholder="请选择分类">
            <el-option
              v-for="item in classifyList"
              :key="item.id"
              :label="item.catName"
              :value="item.id">
            </el-option>
          </el-select>
        </el-form-item>
        <el-form-item label="商品简介" prop="goodDesc">
          <el-input v-model="form.goodDesc" type="textarea" placeholder="请输入商品简介" maxlength="200"/>
        </el-form-item>
        <el-form-item label="商品价格" prop="price">
          <el-input v-model="form.price" placeholder="请输入商品价格" maxlength="8">
            <template slot="append">积分</template>
          </el-input>
        </el-form-item>
        <el-form-item label="库存数量" prop="quantity" class="half-width">
          <el-input v-model="form.quantity" placeholder="请输入库存数量" maxlength="5">
          </el-input>
        </el-form-item>
        <el-form-item label="单位" prop="unit" class="half-width">
          <el-input v-model="form.unit" placeholder="请输入库存数量单位" maxlength="6">
          </el-input>
        </el-form-item>
        <el-form-item label="商品详情" prop="goodDetail">
          <el-upload class="avatar-uploader quill-img" name="file" 
            :action="serverUrl" 
            :show-file-list="false" 
            :headers="uploadHeaders" 
            :on-success="quillImgSuccess" 
            :before-upload="quillImgBefore" 
            accept='.jpg,.jpeg,.png,.gif'>
          </el-upload>
          <quill-editor 
          v-model="form.goodDetail" 
          :options="editorOption" 
          style="height: 420px;"
          ref="myTextEditor"
          />
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
import { listGoods, getGoods, delGoods, addGoods, updateGoods } from "@/api/system/goods"
import { listClassify } from "@/api/system/classify"
import BigFileUpload from '../../../components/BigFileUpload/index.vue'
import {quillEditor} from 'vue-quill-editor'
import 'quill/dist/quill.core.css'
import 'quill/dist/quill.snow.css'
import 'quill/dist/quill.bubble.css'
export default {
  name: "Goods",
  components:{
    BigFileUpload,
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
      // 积分商品表格数据
      goodsList: [],
      // 弹出层标题
      title: "",
      // 是否显示弹出层
      open: false,
      // 查询参数
      queryParams: {
        pageNum: 1,
        pageSize: 10,
        goodName: null,
        goodIcon: null,
        goodDesc: null,
        price: null,
        goodDetail: null,
      },
      // 表单参数
      form: {},
      // 表单校验
      rules: {
        goodName: [
          { required: true, message: "商品名称不能为空", trigger: "blur" }
        ],
        classifyId: [
          { required: true, message: "请选择所属分类" }
        ],
        price: [
          { required: true, message: "商品价格不能为空", trigger: "blur" }
        ],
        quantity: [
          { required: true, message: "库存数量不能为空", trigger: "change" },
          {
            pattern: /^\d+$/,
            message: "库存数量只能为大于等于0的正整数",
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
      serverUrl: process.env.VUE_APP_FILE_SERVER_URL, // 这里写你要上传的图片服务器地址
      uploadHeaders: {
      }, 
      classifyList: []
    }
  },
  created() {
    this.getList()
    this.getClassifyList();
  },
  methods: {
    /** 查询积分商品列表 */
    getList() {
      this.loading = true
      listGoods(this.queryParams).then(response => {
        this.goodsList = response.rows
        this.total = response.total
        this.loading = false
      })
    },
    getClassifyList(){
      listClassify({}).then(response => {
        this.classifyList = response.rows
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
        goodName: null,
        goodIcon: null,
        goodDesc: null,
        price: null,
        goodDetail: null,
        createTime: null,
        createBy: null,
        updateTime: null,
        updateBy: null
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
      this.title = "添加商品"
    },
    /** 修改按钮操作 */
    handleUpdate(row) {
      this.reset()
      const id = row.id || this.ids
      getGoods(id).then(response => {
        this.form = response.data
        this.open = true
        this.title = "修改商品"
      })
    },
    /**
     * 图片上传回执
     */
    handleUploadSuccess(_url, _flag){
      console.log("图片上传回执")
      this.form.goodIcon = _url
    },
    /** 提交按钮 */
    submitForm() {
      this.$refs["form"].validate(valid => {
        if (valid) {
          if(!this.form.goodDetail){
            this.$modal.msgError("商品详情不能为空")
            return false;
          }

          if (this.form.id != null) {
            updateGoods(this.form).then(response => {
              this.$modal.msgSuccess("修改成功")
              this.open = false
              this.getList()
            })
          } else {
            addGoods(this.form).then(response => {
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
      this.$modal.confirm('是否确认删除积分商品编号为"' + ids + '"的数据项？').then(function() {
        return delGoods(ids)
      }).then(() => {
        this.getList()
        this.$modal.msgSuccess("删除成功")
      }).catch(() => {})
    },
    /** 导出按钮操作 */
    handleExport() {
      this.download('system/goods/export', {
        ...this.queryParams
      }, `goods_${new Date().getTime()}.xlsx`)
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
::v-deep .dialog-footer{
  margin-top: 1.3rem;
}
::v-deep .el-dialog .el-input{
  width: 400px !important;
}
::v-deep .el-dialog .el-textarea{
  width: 400px !important;
}
::v-deep .half-width .el-input{
  width: 200px !important;
}
</style>
