#!/usr/bin/env node
const BaotaConfig = require("./baota-config");
const BaotaAPI = require("./baota-api");
const fs = require("fs");

async function tempFix() {
    const config = new BaotaConfig();
    const api = new BaotaAPI(config);
    
    console.log("🩹 临时修复 - 使用现有JS文件");
    
    // 读取当前index.html
    const indexContent = fs.readFileSync("dist/index.html", "utf8");
    
    // 替换JS文件引用为服务器上存在的文件
    const fixedContent = indexContent.replace(
        "index-84e17e4694c67bd8d8e9c2a6037f3ea2.js",
        "index-d1cc01bc9572c0dae48246e8693480fc.js"  // 使用之前存在的JS文件
    );
    
    console.log("上传修复后的index.html...");
    await api.request("/files?action=SaveFileBody", {
        path: "/www/wwwroot/project/h5/index.html",
        data: fixedContent,
        encoding: "utf-8"
    });
    
    console.log("✅ h5应该现在可以访问了（使用之前的JS版本）");
}

tempFix();
