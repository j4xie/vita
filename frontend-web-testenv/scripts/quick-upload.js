#!/usr/bin/env node
// 快速上传关键更新文件
const BaotaConfig = require("./baota-config");
const BaotaAPI = require("./baota-api"); 
const path = require("path");

async function quickUpload() {
    try {
        console.log("🚀 快速上传测试环境关键文件");
        
        const config = new BaotaConfig();
        const api = new BaotaAPI(config);
        const targetPath = "/www/wwwroot/project/test-h5";
        
        const filesToUpload = [
            "index.html",
            "_expo/static/js/web/index-1bd749f3627d57fe7e9b5ad323ffb0dd.js"
        ];
        
        for (const relativeFilePath of filesToUpload) {
            const fullPath = path.join(process.cwd(), "dist", relativeFilePath);
            const targetDir = path.posix.join(targetPath, path.posix.dirname(relativeFilePath));
            
            console.log(`上传: ${relativeFilePath}`);
            await api.uploadFile(fullPath, targetDir);
        }
        
        console.log("✅ 测试环境快速上传完成！");
        
    } catch (error) {
        console.error("❌ 快速上传失败:", error.message);
    }
}

quickUpload();
