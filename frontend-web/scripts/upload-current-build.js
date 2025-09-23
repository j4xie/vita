#!/usr/bin/env node
// 上传当前构建的文件到生产环境
const BaotaConfig = require("./baota-config");
const BaotaAPI = require("./baota-api");
const fs = require("fs");
const path = require("path");

async function uploadCurrentBuild() {
    try {
        console.log("🚀 上传当前构建到生产环境");

        const config = new BaotaConfig();
        const api = new BaotaAPI(config);
        const targetPath = "/www/wwwroot/project/h5";
        const distPath = path.join(process.cwd(), "dist");

        // 获取实际的JS文件名
        const jsDir = path.join(distPath, "_expo/static/js/web");
        const jsFiles = fs.readdirSync(jsDir).filter(f => f.startsWith('index-') && f.endsWith('.js'));

        console.log("找到的JS文件:", jsFiles);

        // 上传关键文件
        const filesToUpload = [
            "index.html",
            ...jsFiles.map(f => `_expo/static/js/web/${f}`)
        ];

        for (const relativeFilePath of filesToUpload) {
            const fullPath = path.join(distPath, relativeFilePath);
            const targetDir = path.posix.join(targetPath, path.posix.dirname(relativeFilePath));

            console.log(`上传: ${relativeFilePath}`);

            // 上传文件（API会自动创建目录）
            await api.uploadFile(fullPath, targetDir);
        }

        console.log("✅ 生产环境上传完成！");
        console.log("🌐 访问 https://web.vitaglobal.icu 查看更新");

    } catch (error) {
        console.error("❌ 上传失败:", error.message);
        process.exit(1);
    }
}

uploadCurrentBuild();