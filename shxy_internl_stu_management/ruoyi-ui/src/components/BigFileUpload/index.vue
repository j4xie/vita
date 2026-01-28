<template>
    <div>
      <span v-if="isOnlyShow">
        <img v-if="defaultUrl" :src="defaultUrl" class="avatar zz" :style="{'width': imgWidth + 'px', 'height': imgHeight + 'px'}" @click="showLayer()"/>
        <div v-else :style="{'width': imgWidth + 'px', 'height': imgHeight + 'px'}"/>
      </span>
      <el-upload
          class="avatar-uploader zz"
          :action="serverUrl"
          :show-file-list="false"
          :on-success="(response, file, fileList) => handleAvatarSuccess(response, file, flag)"
          :before-upload="beforeAvatarUpload"
          :class="defaultUrl ? '' : 'avatar-out-block'"
          v-else
          >
          <img v-if="defaultUrl" :src="defaultUrl" class="avatar zz" :style="{'width': imgWidth + 'px', 'height': imgHeight + 'px'}">
          <i v-else class="el-icon-plus avatar-uploader-icon" :style="{'width': imgWidth + 'px', 'height': imgHeight + 'px', 'line-height': imgHeight + 'px'}"></i>
      </el-upload>

      <div class="layer-v" v-if="isShowLayer" @click="closeLayer()">
        <img :src="defaultUrl"/>
      </div>
    </div>
</template>
<script>
export default{
    name: "BigFileUpload",
    props:{
        defaultUrl: {
          type: String,
          default: ""
        },
        imgWidth: {
          type: Number,
          default: 138
        },
        imgHeight: {
          type: Number,
          default: 138
        },
        flag: {
          type: Number,
          default: 1
        },
        isOnlyShow: {
          type: Boolean,
          default: false
        }
    },
    data(){
        return{
            serverUrl: process.env.VUE_APP_FILE_SERVER_URL, // 这里写你要上传的图片服务器地址
            isShowLayer: false
        }
    },
    mounted(){
        console.log("----mounted----")
    },
    methods:{
        handleAvatarSuccess(res, file, _flag) {
          if(res.code == 200){
            console.log("上传结果");
            console.log(res);
            this.$emit("handleUploadSuccess", res.data, _flag)
            this.$message.success("上传成功")
          }else{
            this.$message.error("上传失败")
          }
        },
        beforeAvatarUpload(file) {
          console.log(file.type)
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
        showLayer(){
          this.isShowLayer = true;
        },
        closeLayer(){
          this.isShowLayer = false;
        }
    }
}
</script>
<style scoped>
.avatar-uploader-icon{
  border: 1px dashed #CCCCCC !important;
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
  text-align: center;
}
.avatar {
  display: block;
}
.layer-v{
  position: fixed;
  z-index: 2;
  height: 100vh;
  width: 100%;
  top: 0;
  left: 0;
  background: rgba(0, 0, 0, 0.2);
  display: flex;
  flex-direction: row;
  align-items: center;
  justify-content: center;
}
</style>
