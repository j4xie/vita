#!/usr/bin/env node
const BaotaConfig = require("./baota-config");
const BaotaAPI = require("./baota-api");

async function uploadKey() {
    const config = new BaotaConfig();
    const api = new BaotaAPI(config);
    
    console.log("🎯 上传生产环境关键文件");
    await api.uploadFile("dist/index.html", "/www/wwwroot/project/h5");
    console.log("✅ 生产环境index.html已更新");
}

uploadKey();
