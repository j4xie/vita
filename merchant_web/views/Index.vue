<template>
  <div id="app">
    <el-container>
      <el-header>
        <h1>Vue with Element Plus</h1>
      </el-header>
      <el-main>
        <el-row>
          <el-col :span="12">
            <el-card class="box-card">
              <template #header>
                <div class="card-header">
                  <span>Element Plus Card</span>
                </div>
              </template>
              <el-button type="primary" @click="showMessage">Click Me!</el-button>
              <p>{{ message }}</p>
            </el-card>
          </el-col>
          <el-col :span="12">
            <el-form :model="form" label-width="120px">
              <el-form-item label="Activity name">
                <el-input v-model="form.name" />
              </el-form-item>
              <el-form-item label="Activity zone">
                <el-select v-model="form.region" placeholder="please select your zone">
                  <el-option label="Zone one" value="shanghai" />
                  <el-option label="Zone two" value="beijing" />
                </el-select>
              </el-form-item>
              <el-form-item>
                <el-button type="primary" @click="onSubmit">Create</el-button>
                <el-button>Cancel</el-button>
              </el-form-item>
            </el-form>
          </el-col>
        </el-row>
      </el-main>
      <el-footer>
        <p>Footer Content</p>
      </el-footer>
    </el-container>
  </div>
</template>

<script>
export default {
  name: 'HomeIndex',
  data() {
    return {
      message: 'Welcome to your Vue.js App with Element Plus!',
      form: {
        name: '',
        region: ''
      }
    }
  },
  methods: {
    showMessage() {
      this.$message({
        message: 'Welcome to Element Plus!',
        type: 'success'
      });
    },
    onSubmit() {
      console.log('submit!', this.form);
      this.$message({
        message: `Form submitted! Name: ${this.form.name}`,
        type: 'info'
      });
    }
  }
}
</script>

<style>
#app {
  font-family: Avenir, Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  color: #2c3e50;
}

.el-header {
  background-color: #409EFF;
  color: #fff;
  display: flex;
  align-items: center;
}

.el-footer {
  background-color: #f5f5f5;
  color: #606266;
  display: flex;
  align-items: center;
  justify-content: center;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.box-card {
  width: 480px;
}

.el-row {
  margin-bottom: 20px;
}

.el-col {
  border-radius: 4px;
}
</style>