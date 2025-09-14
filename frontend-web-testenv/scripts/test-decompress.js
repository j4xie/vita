#!/usr/bin/env node
// 测试解压API
const BaotaConfig = require('./baota-config');
const BaotaAPI = require('./baota-api');

async function testDecompress() {
    try {
        console.log('🧪 测试解压API');

        const config = new BaotaConfig();
        const api = new BaotaAPI(config);

        const zipPath = '/www/wwwroot/project/test-h5/_expo/static/js/web/testenv-bundle.zip';
        const targetPath = '/www/wwwroot/project/test-h5/_expo/static/js/web';

        // 尝试不同的参数组合
        const testCases = [
            {
                name: '参数组合1',
                params: {
                    sfile: zipPath,
                    dfile: targetPath,
                    type: 'zip'
                }
            },
            {
                name: '参数组合2',
                params: {
                    sfile: zipPath,
                    dfile: targetPath
                }
            },
            {
                name: '参数组合3',
                params: {
                    path: zipPath,
                    to: targetPath,
                    type: 'zip'
                }
            }
        ];

        for (const testCase of testCases) {
            try {
                console.log(`\n测试 ${testCase.name}:`);
                console.log('参数:', testCase.params);

                const result = await api.request('/files?action=Decompress', testCase.params);
                console.log('✅ 结果:', result);

                if (result.status !== false) {
                    console.log('🎉 找到正确的参数组合！');
                    break;
                }

            } catch (error) {
                console.log('❌ 失败:', error.message);
            }
        }

    } catch (error) {
        console.error('测试失败:', error.message);
    }
}

testDecompress();