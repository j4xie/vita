#!/usr/bin/env node
const BaotaConfig = require("./baota-config");
const BaotaAPI = require("./baota-api");
const path = require("path");

async function uploadKey() {
    const config = new BaotaConfig();
    const api = new BaotaAPI(config);
    
    console.log("🎯 上传测试环境关键文件");
    await api.uploadFile("dist/index.html", "/www/wwwroot/project/test-h5");
    console.log("✅ 测试环境index.html已更新");
}

uploadKey();
