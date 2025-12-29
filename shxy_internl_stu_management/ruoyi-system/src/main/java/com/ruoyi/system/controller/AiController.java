package com.ruoyi.system.controller;


import com.alibaba.fastjson2.JSON;
import com.alibaba.fastjson2.JSONObject;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseBody;
import org.springframework.web.bind.annotation.RestController;

import java.io.BufferedReader;
import java.io.InputStreamReader;
import java.io.OutputStream;
import java.net.HttpURLConnection;
import java.net.URL;

/**
 * AI控制器
 */
@RestController
@RequestMapping("/app/ai")
public class AiController {

    //本地环境
    String baseUrl = "http://localhost:8087";

    /**
     * 健康检查
     * @return
     */
    @RequestMapping("/check")
    @ResponseBody
    public JSONObject check() {
        JSONObject obj = null;
        try {
            URL url = new URL(baseUrl + "/health");
            HttpURLConnection conn = (HttpURLConnection) url.openConnection();
            conn.setRequestMethod("GET");
            conn.setRequestProperty("Accept", "application/json");

            if (conn.getResponseCode() != 200) {
                throw new RuntimeException("Failed : HTTP error code : " + conn.getResponseCode());
            }
            System.out.println(conn.getResponseMessage().toString());

            BufferedReader br = new BufferedReader(new InputStreamReader((conn.getInputStream())));
            String output;
            StringBuilder response = new StringBuilder();
            while ((output = br.readLine()) != null) {
                response.append(output);
                response.append('\n');
            }
            System.out.println("Response: " + response.toString());
            obj = (JSONObject) JSON.parse(response.toString());
            conn.disconnect();
        } catch (Exception e) {
            e.printStackTrace();
        }

        return obj;
    }

    /**
     * 发送消息并获取AI回复
     * @param message
     * @param userId
     * @param deptId
     * @return
     */
    @RequestMapping("/chat")
    @ResponseBody
    public JSONObject chat(String message, Long userId, Long deptId) {
        JSONObject obj = null;
        try {
            URL url = new URL(baseUrl + "/ask");
            HttpURLConnection conn = (HttpURLConnection) url.openConnection();
            conn.setRequestMethod("POST");
            conn.setRequestProperty("Content-Type", "application/json");

            // 设置是否从输出流发送数据
            conn.setDoOutput(true);
            // 准备JSON数据
            String jsonInputString = "{\"question\":\"" +message+ "\", \"session_id\":\"" + userId + "\", \"deptId\":\"" + deptId + "\"}";
            try (OutputStream os = conn.getOutputStream()) {
                // 将JSON数据写入请求体
                byte[] input = jsonInputString.getBytes("utf-8");
                os.write(input, 0, input.length);
            }

            if (conn.getResponseCode() != 200) {
                throw new RuntimeException("Failed : HTTP error code : " + conn.getResponseCode());
            }

            BufferedReader br = new BufferedReader(new InputStreamReader((conn.getInputStream())));
            String output;
            StringBuilder response = new StringBuilder();
            while ((output = br.readLine()) != null) {
                response.append(output);
                response.append('\n');
            }
            System.out.println("Response: " + response.toString());
            obj = (JSONObject) JSON.parse(response.toString());
            conn.disconnect();
        } catch (Exception e) {
            e.printStackTrace();
        }

        return obj;
    }

    /**
     * 获取会话历史记录
     * @param userId
     * @return
     */
    @RequestMapping("/chatHistory")
    @ResponseBody
    public JSONObject chatHistory(Long userId) {
        JSONObject obj = null;
        try {
            // 定义参数
            URL url = new URL(baseUrl + "/history/" + userId);
            HttpURLConnection conn = (HttpURLConnection) url.openConnection();
            conn.setRequestMethod("GET");
            conn.setRequestProperty("Accept", "application/json");

            if (conn.getResponseCode() != 200) {
                //throw new RuntimeException("Failed : HTTP error code : " + conn.getResponseCode());
                obj = (JSONObject) JSON.parse("{\"detail\": \"会话不存在或已过期\"}");
                return obj;
            }

            BufferedReader br = new BufferedReader(new InputStreamReader((conn.getInputStream())));
            String output;
            StringBuilder response = new StringBuilder();
            while ((output = br.readLine()) != null) {
                response.append(output);
                response.append('\n');
            }
            System.out.println("Response: " + response.toString());
            obj = (JSONObject) JSON.parse(response.toString());
            conn.disconnect();
        } catch (Exception e) {
            e.printStackTrace();
        }

        return obj;
    }


    /**
     * 获取会话历史记录
     * @param userId
     * @return
     */
    /*@RequestMapping("/reset")
    @ResponseBody
    public JSONObject reset(Long userId) {
        JSONObject obj = null;
        try {
            String query = "user_id=" + userId + "&session_id=" + userId;
            URL url = new URL(baseUrl + "/api/ai/reset?" + query);
            HttpURLConnection conn = (HttpURLConnection) url.openConnection();
            conn.setRequestMethod("POST");
            conn.setRequestProperty("Accept", "application/json");

            if (conn.getResponseCode() != 200) {
                throw new RuntimeException("Failed : HTTP error code : " + conn.getResponseCode());
            }

            BufferedReader br = new BufferedReader(new InputStreamReader((conn.getInputStream())));
            String output;
            System.out.println("Output from Server .... \n");
            while ((output = br.readLine()) != null) {
                System.out.println(output);
                obj = (JSONObject) JSON.parse(output);
            }
            conn.disconnect();
        } catch (Exception e) {
            e.printStackTrace();
        }

        return obj;
    }*/


    /**
     * 删除会话（清空历史）
     * @param userId
     * @return
     */
    @RequestMapping("/delete")
    @ResponseBody
    public JSONObject delete(Long userId) {
        JSONObject obj = null;
        try {
            URL url = new URL(baseUrl + "/clear/" + userId);
            HttpURLConnection conn = (HttpURLConnection) url.openConnection();
            conn.setRequestMethod("DELETE");
            conn.setRequestProperty("Accept", "application/json");

            if (conn.getResponseCode() != 200) {
                throw new RuntimeException("Failed : HTTP error code : " + conn.getResponseCode());
            }

            BufferedReader br = new BufferedReader(new InputStreamReader((conn.getInputStream())));
            String output;
            StringBuilder response = new StringBuilder();
            while ((output = br.readLine()) != null) {
                response.append(output);
                response.append('\n');
            }
            System.out.println("Response: " + response.toString());
            obj = (JSONObject) JSON.parse(response.toString());
            conn.disconnect();
        } catch (Exception e) {
            e.printStackTrace();
        }

        return obj;
    }
}
