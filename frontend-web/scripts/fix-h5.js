#!/usr/bin/env node
const BaotaConfig = require("./baota-config");
const BaotaAPI = require("./baota-api");

async function fixH5() {
    const config = new BaotaConfig();
    const api = new BaotaAPI(config);
    
    console.log("🔧 修复h5环境 - 上传正确的JS文件");
    
    try {
        await api.uploadFile("dist/index.html", "/www/wwwroot/project/h5");
        console.log("✅ index.html已更新");
    } catch (error) {
        console.log("index.html:", error.message);
    }
    
    console.log("⚠️ 大JS文件需要通过其他方式上传");
    console.log("文件路径: dist/_expo/static/js/web/index-84e17e4694c67bd8d8e9c2a6037f3ea2.js");
    console.log("目标路径: /www/wwwroot/project/h5/_expo/static/js/web/");
}

fixH5();
