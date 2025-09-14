#!/usr/bin/env node
const BaotaConfig = require("./baota-config");
const BaotaAPI = require("./baota-api");
const path = require("path");

async function uploadLatest() {
    try {
        console.log("🚀 上传最新构建文件");
        
        const config = new BaotaConfig();
        const api = new BaotaAPI(config);
        const targetPath = "/www/wwwroot/project/test-h5";
        
        // 上传关键更新文件
        const files = [
            "index.html",
            "_expo/static/js/web/index-27d1f6a3a2998fc416ad0785bc6bdbe0.js"
        ];
        
        for (const file of files) {
            const fullPath = path.join(process.cwd(), "dist", file);
            const targetDir = path.posix.join(targetPath, path.posix.dirname(file));
            
            console.log(`上传: ${file}`);
            try {
                await api.uploadFile(fullPath, targetDir);
                console.log(`✅ ${file} 上传成功`);
            } catch (error) {
                console.log(`❌ ${file} 上传失败: ${error.message}`);
            }
        }
        
        console.log("🎉 最新文件上传完成！");
        
    } catch (error) {
        console.error("❌ 上传失败:", error.message);
    }
}

uploadLatest();
