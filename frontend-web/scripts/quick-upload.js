#!/usr/bin/env node
// 快速上传关键更新文件
const BaotaConfig = require("./baota-config");
const BaotaAPI = require("./baota-api"); 
const path = require("path");

async function quickUpload() {
    try {
        console.log("🚀 快速上传生产环境关键文件");
        
        const config = new BaotaConfig();
        const api = new BaotaAPI(config);
        const targetPath = "/www/wwwroot/project/h5";
        
        const filesToUpload = [
            "index.html", 
            "_expo/static/js/web/index-d1cc01bc9572c0dae48246e8693480fc.js"
        ];
        
        for (const relativeFilePath of filesToUpload) {
            const fullPath = path.join(process.cwd(), "dist", relativeFilePath);
            const targetDir = path.posix.join(targetPath, path.posix.dirname(relativeFilePath));
            
            console.log(`上传: ${relativeFilePath}`);
            await api.uploadFile(fullPath, targetDir);
        }
        
        console.log("✅ 生产环境快速上传完成！");
        
    } catch (error) {
        console.error("❌ 快速上传失败:", error.message);
    }
}

quickUpload();
