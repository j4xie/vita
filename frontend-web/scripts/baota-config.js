// 宝塔面板API配置文件
const crypto = require('crypto');

class BaotaConfig {
    constructor() {
        // 宝塔面板配置
        this.panelUrl = 'https://106.14.165.234:8888';
        this.apiKey = 'rbxLQQr0qDBvwcbOxZt9VVPJvy3mIDVN';
        
        // 部署目录配置 - 生产环境专用
        this.deployPath = '/www/wwwroot/project/h5';
        
        // 临时文件配置
        this.tempDir = '/tmp';
        this.uploadPath = '/tmp';
    }

    // 生成宝塔API签名
    generateSignature() {
        const requestTime = Math.floor(Date.now() / 1000);
        
        // 按照官方文档的算法: request_token = md5(string(request_time) + md5(api_sk))
        const step1 = crypto.createHash('md5').update(this.apiKey).digest('hex');
        const step2 = requestTime.toString() + step1;
        const requestToken = crypto.createHash('md5').update(step2).digest('hex');
        
        return {
            request_time: requestTime,
            request_token: requestToken
        };
    }

    // 获取完整的API URL
    getApiUrl(endpoint) {
        return `${this.panelUrl}${endpoint}`;
    }

    // 获取部署路径 - 生产环境固定路径
    getDeployPath() {
        return this.deployPath;
    }
}

module.exports = BaotaConfig;