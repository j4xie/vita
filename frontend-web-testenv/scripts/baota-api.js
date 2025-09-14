// 宝塔面板API调用工具类
const axios = require('axios');
const FormData = require('form-data');
const fs = require('fs');
const path = require('path');
const https = require('https');

class BaotaAPI {
    constructor(config) {
        this.config = config;
        this.cookieJar = []; // 保存cookie
        
        // 创建axios实例，忽略SSL证书错误
        this.client = axios.create({
            timeout: 60000, // 60秒超时
            httpsAgent: new https.Agent({
                rejectUnauthorized: false
            }),
            withCredentials: true // 自动处理cookies
        });
        
        // 添加请求拦截器来处理cookie
        this.client.interceptors.request.use((config) => {
            if (this.cookieJar.length > 0) {
                config.headers.Cookie = this.cookieJar.join('; ');
            }
            return config;
        });
        
        // 添加响应拦截器来保存cookie
        this.client.interceptors.response.use((response) => {
            const setCookieHeader = response.headers['set-cookie'];
            if (setCookieHeader) {
                this.cookieJar = setCookieHeader.map(cookie => cookie.split(';')[0]);
            }
            return response;
        });
    }

    // 通用API请求方法
    async request(endpoint, params = {}, files = null) {
        const signature = this.config.generateSignature();
        const url = this.config.getApiUrl(endpoint);
        
        let formData;
        if (files) {
            // 文件上传请求
            formData = new FormData();
            Object.keys(signature).forEach(key => {
                formData.append(key, signature[key]);
            });
            Object.keys(params).forEach(key => {
                if (params[key] !== undefined) {
                    formData.append(key, params[key]);
                }
            });
            
            // 添加文件
            Object.keys(files).forEach(key => {
                formData.append(key, files[key]);
            });
        } else {
            // 普通POST请求
            formData = new URLSearchParams();
            Object.keys(signature).forEach(key => {
                formData.append(key, signature[key]);
            });
            Object.keys(params).forEach(key => {
                if (params[key] !== undefined) {
                    formData.append(key, params[key]);
                }
            });
        }

        try {
            const response = await this.client.post(url, formData, {
                headers: files ? formData.getHeaders() : {
                    'Content-Type': 'application/x-www-form-urlencoded'
                }
            });
            
            return response.data;
        } catch (error) {
            console.error('宝塔API请求失败:', error.message);
            if (error.response) {
                console.error('响应状态:', error.response.status);
                console.error('响应数据:', error.response.data);
            }
            throw error;
        }
    }

    // 上传文件到宝塔面板（使用宝塔的分片上传格式）
    async uploadFile(filePath, targetPath = '/tmp') {
        if (!fs.existsSync(filePath)) {
            throw new Error(`文件不存在: ${filePath}`);
        }

        console.log(`正在上传文件: ${path.basename(filePath)}`);
        
        const fileName = path.basename(filePath);
        const fileStats = fs.statSync(filePath);
        const fileSize = fileStats.size;
        const fileContent = fs.readFileSync(filePath);
        
        // 使用宝塔的真实API参数格式
        const signature = this.config.generateSignature();
        const url = this.config.getApiUrl('/files?action=upload');
        
        const formData = new FormData();
        formData.append('request_time', signature.request_time);
        formData.append('request_token', signature.request_token);
        formData.append('f_path', targetPath);
        formData.append('f_name', fileName);
        formData.append('f_size', fileSize.toString());
        formData.append('f_start', '0');
        formData.append('blob', fileContent, {
            filename: fileName,
            contentType: 'application/octet-stream'
        });

        try {
            const response = await this.client.post(url, formData, {
                headers: formData.getHeaders()
            });
            
            if (response.data.status === false) {
                throw new Error(`文件上传失败: ${response.data.msg || '未知错误'}`);
            }
            
            console.log(`文件上传成功: ${fileName}`);
            return response.data;
        } catch (error) {
            console.error('宝塔API请求失败:', error.message);
            if (error.response) {
                console.error('响应状态:', error.response.status);
                console.error('响应数据:', error.response.data);
            }
            throw error;
        }
    }

    // 批量上传目录中的文件
    async uploadDirectory(sourceDir, targetPath) {
        console.log(`正在批量上传目录: ${sourceDir} -> ${targetPath}`);
        
        // 确保目标目录存在
        await this.createDirectory(targetPath);
        
        const uploadFile = async (filePath, relativePath) => {
            const targetFilePath = path.posix.join(targetPath, relativePath);
            const targetDir = path.posix.dirname(targetFilePath);
            
            // 确保目标子目录存在
            if (targetDir !== targetPath) {
                await this.createDirectory(targetDir);
            }
            
            console.log(`上传: ${relativePath}`);
            await this.uploadFile(filePath, targetDir);
        };
        
        // 递归上传所有文件
        const uploadRecursive = async (currentDir, relativePath = '') => {
            const items = fs.readdirSync(currentDir, { withFileTypes: true });
            
            for (const item of items) {
                const fullPath = path.join(currentDir, item.name);
                const relPath = relativePath ? path.posix.join(relativePath, item.name) : item.name;
                
                if (item.isDirectory()) {
                    await uploadRecursive(fullPath, relPath);
                } else if (item.isFile()) {
                    await uploadFile(fullPath, relPath);
                }
            }
        };
        
        await uploadRecursive(sourceDir);
        console.log('目录上传完成');
    }

    // 解压文件
    async extractFile(zipFilePath, targetPath) {
        console.log(`正在解压文件: ${zipFilePath} 到: ${targetPath}`);

        const params = {
            sfile: zipFilePath,
            dfile: targetPath,
            type: 'zip'
        };

        const result = await this.request('/files?action=Decompress', params);

        if (result.status === false) {
            throw new Error(`文件解压失败: ${result.msg || '未知错误'}`);
        }

        console.log('文件解压成功');
        return result;
    }

    // 删除文件
    async deleteFile(filePath) {
        console.log(`正在删除文件: ${filePath}`);
        
        const params = {
            path: filePath
        };

        const result = await this.request('/files?action=DeleteFile', params);
        
        if (result.status === false) {
            console.log(`删除文件失败: ${result.msg || '未知错误'}`);
            return false;
        }
        
        console.log('文件删除成功');
        return true;
    }

    // 创建目录
    async createDirectory(dirPath) {
        console.log(`正在创建目录: ${dirPath}`);
        
        const params = {
            path: dirPath
        };

        const result = await this.request('/files?action=CreateDir', params);
        
        if (result.status === false) {
            // 目录已存在不算错误
            if (result.msg && result.msg.includes('已存在')) {
                console.log('目录已存在');
                return true;
            }
            throw new Error(`创建目录失败: ${result.msg || '未知错误'}`);
        }
        
        console.log('目录创建成功');
        return true;
    }

    // 获取文件列表
    async getFileList(dirPath) {
        const params = {
            path: dirPath
        };

        const result = await this.request('/files?action=GetDir', params);
        
        if (result.status === false) {
            throw new Error(`获取文件列表失败: ${result.msg || '未知错误'}`);
        }
        
        return result;
    }
}

module.exports = BaotaAPI;