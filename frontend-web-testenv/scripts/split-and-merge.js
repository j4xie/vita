#!/usr/bin/env node
// 分割大文件为小文件上传后合并
const BaotaConfig = require('./baota-config');
const BaotaAPI = require('./baota-api');
const fs = require('fs');

async function splitAndMerge() {
    try {
        console.log('✂️ 分割大文件上传后合并');

        const config = new BaotaConfig();
        const api = new BaotaAPI(config);

        const prodJSPath = '/Users/jietaoxie/pomeloX/frontend-web/dist/_expo/static/js/web/index-feb84fe8a97c3bfe8682c1f0de09e0ad.js';
        const targetDir = '/www/wwwroot/project/h5/_expo/static/js/web';
        const targetFile = 'index-feb84fe8a97c3bfe8682c1f0de09e0ad.js';

        // 读取文件内容
        const jsContent = fs.readFileSync(prodJSPath, 'utf8');
        const fileSize = jsContent.length;
        const chunkSize = 800000; // 800KB分块
        const totalChunks = Math.ceil(fileSize / chunkSize);

        console.log(`文件大小: ${(fileSize/1024/1024).toFixed(2)}MB`);
        console.log(`分块数量: ${totalChunks}`);

        // 1. 上传分块文件
        console.log('\n📤 上传分块文件...');
        for (let i = 0; i < totalChunks; i++) {
            const start = i * chunkSize;
            const end = Math.min(start + chunkSize, fileSize);
            const chunk = jsContent.substring(start, end);

            const chunkName = `${targetFile}.part${i}`;

            console.log(`上传分块 ${i + 1}/${totalChunks}: ${chunkName}`);

            await api.request('/files?action=SaveFileBody', {
                path: `${targetDir}/${chunkName}`,
                data: chunk,
                encoding: 'utf-8'
            });

            console.log(`✅ 分块 ${i + 1} 上传成功`);
        }

        // 2. 在服务器端合并文件
        console.log('\n🔗 在服务器端合并文件...');

        const mergeScript = `cd ${targetDir}
# 删除目标文件（如果存在）
rm -f ${targetFile}

# 合并所有分块
cat ${targetFile}.part* > ${targetFile}

# 删除分块文件
rm -f ${targetFile}.part*

echo "文件合并完成"
ls -la ${targetFile}
`;

        const mergeResult = await api.request('/files?action=ExecShell', {
            shell: mergeScript,
            path: targetDir
        });

        console.log('合并结果:', mergeResult);

        // 3. 验证合并后的文件
        console.log('\n🔍 验证合并结果...');
        const verifyResult = await api.request('/files?action=GetDir', {
            path: targetDir
        });

        const files = (verifyResult.FILES || []).map(f => f.split(';')[0]);
        const targetExists = files.includes(targetFile);

        console.log('目标文件存在:', targetExists ? '✅' : '❌');

        if (targetExists) {
            // 获取文件大小验证
            const targetFileInfo = (verifyResult.FILES || []).find(f => f.includes(targetFile));
            if (targetFileInfo) {
                const [name, size] = targetFileInfo.split(';');
                console.log(`文件大小: ${(size/1024/1024).toFixed(2)}MB`);

                if (size > 3000000) { // 大于3MB说明合并成功
                    console.log('🎉 大文件上传成功！h5现在应该可以正常访问了');
                } else {
                    console.log('⚠️ 文件大小异常，可能合并失败');
                }
            }
        }

    } catch (error) {
        console.error('❌ 分割合并失败:', error.message);
    }
}

splitAndMerge();