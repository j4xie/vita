<template>
  <div class="app-container">
    <el-form ref="form" :model="form" :rules="rules" label-width="180px">
      <el-form-item label="Business Name" prop="merchantName">
        <el-input v-model="form.merchantName" placeholder="Please input" maxlength="80"/>
      </el-form-item>
      <el-form-item label="Business English Name" prop="merchantEnName">
        <el-input v-model="form.merchantEnName" placeholder="Please input" maxlength="80"/>
      </el-form-item>
      <el-form-item label="Business Introduction" prop="merchantDesc">
        <el-input v-model="form.merchantDesc" type="textarea" placeholder="Please input" maxlength="300"/>
      </el-form-item>
      <el-row>
        <el-col :span="12">
          <el-form-item label="LOGO" prop="logo">
            <div class="upload-box">
              <BigFileUpload 
                @handleUploadSuccess="handleUploadSuccess"
                :defaultUrl = "form.logo"
                :imgWidth="138"
                :imgHeight="138"
                :flag="1"
                :isOnlyShow="false"
              />
            </div>
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item label="Shop Picture" prop="shopImg">
            <div class="upload-box">
              <BigFileUpload 
                @handleUploadSuccess="handleUploadSuccess"
                :defaultUrl = "form.shopImg"
                :imgWidth="200"
                :imgHeight="138"
                :flag="2"
                :isOnlyShow="false"
              />
            </div>
          </el-form-item>
        </el-col>
      </el-row>
      <el-row>
        <el-col :span="12">
          <el-form-item label="Select School" prop="deptId">
            <el-select v-model="form.deptId" clearable placeholder="Please select">
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
            <el-select v-model="form.principalType" clearable placeholder="Please select">
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
            <el-input v-model="form.accountName" placeholder="Please input" maxlength="50"/>
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item label="Account number" prop="bankAccount">
            <el-input v-model="form.bankAccount" placeholder="Please input" maxlength="25"/>
          </el-form-item>
        </el-col>
      </el-row>
      <el-row>
        <el-col :span="12">
          <el-form-item label="Routing Number" prop="rn">
            <el-input v-model="form.rn" placeholder="Please input" maxlength="25"/>
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item label="Account Holder Name" prop="acHolderName">
            <el-input v-model="form.acHolderName" placeholder="Please input" maxlength="18"/>
          </el-form-item>
        </el-col>
      </el-row>
      <el-form-item label="Social Security Number" prop="ssn" v-if="form.principalType == 1">
        <el-input v-model="form.ssn" placeholder="Please input" maxlength="18"/>
      </el-form-item>
      <el-form-item label="Employer Identification Number" prop="ein" class="lon-txt" v-if="form.principalType == 2">
        <el-input v-model="form.ein" placeholder="Please input" maxlength="18"/>
      </el-form-item>
      <el-form-item label="Authorized Representative ID" prop="legalPerCard" class="lon-txt">
        <el-input v-model="form.legalPerCard" placeholder="Please input" maxlength="20"/>
      </el-form-item>
      <el-form-item label="Authorized Representative Name" prop="legalName" class="lon-txt">
        <el-input v-model="form.legalName" placeholder="Please input" maxlength="50"/>
      </el-form-item>
      <el-form-item label="Shop Address" prop="merchantAddress">
        <el-input v-model="form.merchantAddress" placeholder="Please click the select address button to choose location" maxlength="120" readonly>
          <template #append>
            <el-button @click="choseMap">Select Address</el-button>
          </template>
        </el-input>
      </el-form-item>
      
      <!-- 地图选择弹窗 -->
      <el-dialog
        title="Select Shop Location"
        v-model="openMap"
        width="800px"
        :before-close="closeMapDialog"
        destroy-on-close>
        <div class="map-container">
          <!-- 搜索框 -->
          <div class="search-box">
            <el-input
              v-model="searchKeyword"
              placeholder="Enter address or location name"
              clearable
              :loading="searchLoading">
              <template #append>
                <el-button @click="searchLocation" :loading="searchLoading">
                  Search
                </el-button>
              </template>
            </el-input>
          </div>
          
          <!-- 地图容器 -->
          <div id="google-map" class="google-map"></div>
          
          <!-- 选中位置信息 -->
          <div class="selected-info" v-if="selectedAddress">
            <el-card>
              <div class="info-item">
                <strong>Selected Address:</strong> {{ selectedAddress }}
              </div>
              <div class="info-item">
                <strong>Latitude:</strong> {{ selectedLatitude }}
              </div>
              <div class="info-item">
                <strong>Longitude:</strong> {{ selectedLongitude }}
              </div>
            </el-card>
          </div>
        </div>
        
        <template #footer>
          <span class="dialog-footer">
            <el-button @click="closeMapDialog">Cancel</el-button>
            <el-button type="primary" @click="confirmLocation">Confirm</el-button>
          </span>
        </template>
      </el-dialog>
      <el-row>
        <el-col :span="12">
          <el-form-item label="Zipcode" prop="zipcode">
            <el-input v-model="form.zipcode" placeholder="Please input" maxlength="20"/>
          </el-form-item>
        </el-col>
        <el-col :span="12">
        </el-col>
      </el-row>
      <el-row>
        <el-col :span="12">
          <el-form-item label="Phone Number" prop="phonenumber">
            <el-input v-model="form.phonenumber" placeholder="Please input" maxlength="20"/>
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item label="Email" prop="email">
            <el-input v-model="form.email" placeholder="Please input" maxlength="18"/>
          </el-form-item>
        </el-col>
      </el-row>
      <el-row>
        <el-col :span="12">
          <el-form-item label="Login Username" prop="userName">
            <el-input v-model="form.userName" placeholder="Please input" maxlength="30"/>
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item label="Login Password" prop="password" v-if="form.userId == undefined">
            <el-input v-model="form.password" placeholder="Please input" type="password" maxlength="20" show-password/>
          </el-form-item>
        </el-col>
      </el-row>
      <el-row>
        <el-col :span="12">
          <el-form-item label="Business Registration Document" prop="businessLicense">
            <div class="upload-box">
              <BigFileUpload 
                @handleUploadSuccess="handleUploadSuccess"
                :defaultUrl = "form.businessLicense"
                :imgWidth="180"
                :imgHeight="138"
                :flag="3"
                :isOnlyShow="false"
              />
            </div>
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item label="Permit License" prop="permitLicense">
            <div class="upload-box">
              <BigFileUpload 
                @handleUploadSuccess="handleUploadSuccess"
                :defaultUrl = "form.permitLicense"
                :imgWidth="180"
                :imgHeight="138"
                :flag="4"
                :isOnlyShow="false"
              />
            </div>
          </el-form-item>
        </el-col>
      </el-row>
      <el-row>
        <el-col :span="24">
          <el-form-item class="form-buttons">
            <el-button type="primary" @click="submitForm">Submit</el-button>
            <el-button @click="reset">Reset</el-button>
          </el-form-item>
        </el-col>
      </el-row>
    </el-form>
  </div>
</template>

<script>
import BigFileUpload from '@/components/BigFileUpload.vue'

export default {
  name: 'HomeIndex',
  components: {
    BigFileUpload
  },
  data() {
    return {
      form: {
        merchantName: '',
        merchantEnName: '',
        merchantDesc: '',
        logo: '',
        shopImg: '',
        deptId: '',
        principalType: '',
        accountName: '',
        bankAccount: '',
        rn: '',
        acHolderName: '',
        ssn: '',
        ein: '',
        legalPerCard: '',
        legalName: '',
        merchantAddress: '',
        latitude: '',
        longitude: '',
        zipcode: '',
        phonenumber: '',
        email: '',
        userName: '',
        password: '',
        businessLicense: '',
        permitLicense: '',
        userId: undefined
      },
      deptList: [],
      // 地图相关数据
      openMap: false,
      mapLoading: false,
      map: null,
      geocoder: null,
      placesService: null,
      marker: null,
      selectedAddress: '',
      selectedLatitude: '',
      selectedLongitude: '',
      searchKeyword: '',
      searchLoading: false,
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
          { required: true, message: "Please input shop address", trigger: "blur" }
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
          { min: 2, max: 20, message: 'Login username length must be between 2 and 20', trigger: 'blur' }
        ],
        legalName: [
          { required: true, message: "Please input authorized representative name", trigger: "blur" }
        ],
        password: [
          { required: true, message: "Password cannot be empty", trigger: "blur" },
          { min: 5, max: 20, message: 'Password length must be between 5 and 20', trigger: 'blur' },
          { pattern: /^[^<>'"|\\]+$/, message: "Cannot contain illegal characters: < > \" ' \\\\ |", trigger: "blur" }
        ],
        phonenumber: [
          {
            pattern: /^\d+$/,
            message: "Please enter a valid phone number",
            trigger: "blur"
          }
        ],
        email: [
          {
            type: "email",
            message: "Please enter a valid email address",
            trigger: ["blur", "change"]
          }
        ],
        businessLicense: [
          { required: true, message: "Please upload business registration document", trigger: "blur" }
        ],
      }
    }
  },
  methods: {
    reset() {
      this.form = {
        merchantName: '',
        merchantEnName: '',
        merchantDesc: '',
        logo: '',
        shopImg: '',
        deptId: '',
        principalType: '',
        accountName: '',
        bankAccount: '',
        rn: '',
        acHolderName: '',
        ssn: '',
        ein: '',
        legalPerCard: '',
        legalName: '',
        merchantAddress: '',
        latitude: '',
        longitude: '',
        zipcode: '',
        phonenumber: '',
        email: '',
        userName: '',
        password: '',
        businessLicense: '',
        permitLicense: '',
        userId: undefined
      };
      this.$nextTick(() => {
        if (this.$refs.form) {
          this.$refs.form.clearValidate();
        }
      });
    },
    submitForm() {
      this.$refs["form"].validate((valid) => {
        if (valid) {
          // 提交表单的逻辑
          this.$message.success("Merchant information saved successfully!");
        }
      });
    },
    choseMap() {
      this.openMap = true;
      this.$nextTick(() => {
        // 延迟一小段时间确保DOM完全渲染
        setTimeout(() => {
          this.initGoogleMap();
        }, 100);
      });
    },

    // 初始化Google地图
    initGoogleMap(retryCount = 0) {
      // 检查Google Maps API是否已加载
      if (window.google && window.google.maps) {
        this.createMap();
        return;
      }

      // 检查是否已经在加载中
      if (this.mapLoading) {
        // 如果正在加载，等待一段时间后重试
        if (retryCount < 10) { // 最多重试10次
          setTimeout(() => {
            this.initGoogleMap(retryCount + 1);
          }, 100);
        } else {
          this.$message.error('地图服务加载超时，请刷新页面重试');
        }
        return;
      }
      this.mapLoading = true;

      // 动态加载Google Maps API
      const script = document.createElement('script');
      const callbackName = `initGoogleMapCallback_${Date.now()}`;
      script.src = `https://maps.googleapis.com/maps/api/js?key=AIzaSyA8l6T6nQmrR9JIFHGnq9mgrOGYCzT8aEg&libraries=places&callback=${callbackName}`;
      script.async = true;
      script.defer = true;
      
      // 设置全局回调函数
      window[callbackName] = () => {
        try {
          // 确保API完全加载
          if (window.google && window.google.maps) {
            this.createMap();
          } else {
            throw new Error('Google Maps API未正确加载');
          }
        } catch (error) {
          console.error('Google Maps初始化失败:', error);
          this.$message.error('地图初始化失败: ' + error.message);
        } finally {
          this.mapLoading = false;
          // 清理回调函数
          delete window[callbackName];
        }
      };
      
      script.onerror = () => {
        console.error('Google Maps API加载失败');
        this.$message.error('地图加载失败，请检查网络连接');
        this.mapLoading = false;
        // 清理回调函数
        delete window[callbackName];
        // 移除script标签
        if (document.head.contains(script)) {
          document.head.removeChild(script);
        }
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
          this.$message.error('地图服务未初始化，请稍后重试');
          // 重新尝试初始化
          setTimeout(() => {
            this.initGoogleMap();
          }, 1000);
          return;
        }

        // 默认中心位置（可以设置为用户当前位置或其他默认位置）
        const defaultCenter = { lat: 40.7128, lng: -74.0060 }; // 纽约市
        
        // 创建地图实例
        // eslint-disable-next-line no-undef
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
        // eslint-disable-next-line no-undef
        this.geocoder = new google.maps.Geocoder();

        // 创建Places服务
        // eslint-disable-next-line no-undef
        this.placesService = new google.maps.places.PlacesService(this.map);

        // 创建标记
        // eslint-disable-next-line no-undef
        this.marker = new google.maps.Marker({
          position: defaultCenter,
          map: this.map,
          draggable: true,
          title: "拖拽选择位置",
          // eslint-disable-next-line no-undef
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

      // 检查地图服务是否已初始化
      if (!this.geocoder || !window.google || !window.google.maps) {
        this.$message.error('地图服务未初始化，请关闭弹窗后重新打开');
        // 尝试重新初始化
        this.initGoogleMap();
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
          // eslint-disable-next-line no-undef
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
    handleUploadSuccess(response, flag) {
      // 处理文件上传成功的回调
      console.log('File uploaded successfully:', response, flag);
      switch(flag) {
        case 1:
          this.form.logo = response.url || response.path || response;
          break;
        case 2:
          this.form.shopImg = response.url || response.path || response;
          break;
        case 3:
          this.form.businessLicense = response.url || response.path || response;
          break;
        case 4:
          this.form.permitLicense = response.url || response.path || response;
          break;
      }
    }
  }
}
</script>

<style>
.app-container {
  padding: 20px;
}

.el-body-dialog .el-form-item {
    margin-bottom: 20px;
  }
  
  .el-body-dialog .upload-box {
    width: 100%;
  }
  
  .el-body-dialog .avatar-uploader {
    border: 1px dashed #d9d9d9;
    border-radius: 6px;
    cursor: pointer;
    position: relative;
    overflow: hidden;
    width: 138px;
    height: 138px;
    display: flex;
    align-items: center;
    justify-content: center;
  }
  
  .el-body-dialog .avatar-uploader:hover {
    border-color: #409eff;
  }
  
  .el-body-dialog .avatar-uploader-icon {
    font-size: 28px;
    color: #8c939d;
    width: 138px;
    height: 138px;
    line-height: 138px;
    text-align: center;
  }
  
  .el-body-dialog .avatar {
    width: 138px;
    height: 138px;
    display: block;
  }
  
  .el-body-dialog .avatar-large {
    width: 200px;
    height: 138px;
    display: block;
  }
  
  .el-body-dialog .avatar-medium {
    width: 180px;
    height: 138px;
    display: block;
  }
  
  .el-body-dialog .lon-txt .el-form-item__content {
    width: 100%;
  }

.dialog-footer {
  text-align: right;
}

.form-buttons .el-form-item__content{
  display: flex;
  flex-direction: row;
  justify-content: center;
  margin-left: 0px !important;
}
.form-buttons .el-button{
  width: 150px;
}

/* 地图相关样式 */
.map-container {
  width: 100%;
}

.search-box {
  margin-bottom: 15px;
}

.google-map {
  width: 100%;
  height: 400px;
  border: 1px solid #dcdfe6;
  border-radius: 4px;
  margin-bottom: 15px;
}

.selected-info {
  margin-top: 15px;
}

.info-item {
  margin-bottom: 8px;
  font-size: 14px;
  line-height: 1.5;
}

.info-item strong {
  color: #606266;
  margin-right: 8px;
}
</style>