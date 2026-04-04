/*
 * Decompiled with CFR 0.152.
 * 
 * Could not load the following classes:
 *  com.alibaba.fastjson2.JSON
 *  com.alibaba.fastjson2.JSONObject
 *  org.springframework.web.bind.annotation.RequestMapping
 *  org.springframework.web.bind.annotation.ResponseBody
 *  org.springframework.web.bind.annotation.RestController
 */
package com.ruoyi.system.controller;

import com.alibaba.fastjson2.JSON;
import com.alibaba.fastjson2.JSONObject;
import java.io.BufferedReader;
import java.io.InputStreamReader;
import java.io.OutputStream;
import java.net.HttpURLConnection;
import java.net.URL;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseBody;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping(value={"/app/ai"})
public class AiController {
    String baseUrl = "http://localhost:8087";

    @RequestMapping(value={"/check"})
    @ResponseBody
    public JSONObject check() {
        JSONObject obj = null;
        try {
            String output;
            URL url = new URL(this.baseUrl + "/health");
            HttpURLConnection conn = (HttpURLConnection)url.openConnection();
            conn.setRequestMethod("GET");
            conn.setRequestProperty("Accept", "application/json");
            if (conn.getResponseCode() != 200) {
                throw new RuntimeException("Failed : HTTP error code : " + conn.getResponseCode());
            }
            System.out.println(conn.getResponseMessage().toString());
            BufferedReader br = new BufferedReader(new InputStreamReader(conn.getInputStream()));
            StringBuilder response = new StringBuilder();
            while ((output = br.readLine()) != null) {
                response.append(output);
                response.append('\n');
            }
            System.out.println("Response: " + response.toString());
            obj = (JSONObject)JSON.parse((String)response.toString());
            conn.disconnect();
        }
        catch (Exception e) {
            e.printStackTrace();
        }
        return obj;
    }

    @RequestMapping(value={"/chat"})
    @ResponseBody
    public JSONObject chat(String message, Long userId, Long deptId) {
        JSONObject obj = null;
        try {
            String output;
            URL url = new URL(this.baseUrl + "/ask");
            HttpURLConnection conn = (HttpURLConnection)url.openConnection();
            conn.setRequestMethod("POST");
            conn.setRequestProperty("Content-Type", "application/json");
            conn.setDoOutput(true);
            String jsonInputString = "{\"question\":\"" + message + "\", \"session_id\":\"" + userId + "\", \"deptId\":\"" + deptId + "\"}";
            try (OutputStream os = conn.getOutputStream();){
                byte[] input = jsonInputString.getBytes("utf-8");
                os.write(input, 0, input.length);
            }
            if (conn.getResponseCode() != 200) {
                throw new RuntimeException("Failed : HTTP error code : " + conn.getResponseCode());
            }
            BufferedReader br = new BufferedReader(new InputStreamReader(conn.getInputStream()));
            StringBuilder response = new StringBuilder();
            while ((output = br.readLine()) != null) {
                response.append(output);
                response.append('\n');
            }
            System.out.println("Response: " + response.toString());
            obj = (JSONObject)JSON.parse((String)response.toString());
            conn.disconnect();
        }
        catch (Exception e) {
            e.printStackTrace();
        }
        return obj;
    }

    @RequestMapping(value={"/chatHistory"})
    @ResponseBody
    public JSONObject chatHistory(Long userId) {
        JSONObject obj = null;
        try {
            String output;
            URL url = new URL(this.baseUrl + "/history/" + userId);
            HttpURLConnection conn = (HttpURLConnection)url.openConnection();
            conn.setRequestMethod("GET");
            conn.setRequestProperty("Accept", "application/json");
            if (conn.getResponseCode() != 200) {
                obj = (JSONObject)JSON.parse((String)"{\"detail\": \"\u4f1a\u8bdd\u4e0d\u5b58\u5728\u6216\u5df2\u8fc7\u671f\"}");
                return obj;
            }
            BufferedReader br = new BufferedReader(new InputStreamReader(conn.getInputStream()));
            StringBuilder response = new StringBuilder();
            while ((output = br.readLine()) != null) {
                response.append(output);
                response.append('\n');
            }
            System.out.println("Response: " + response.toString());
            obj = (JSONObject)JSON.parse((String)response.toString());
            conn.disconnect();
        }
        catch (Exception e) {
            e.printStackTrace();
        }
        return obj;
    }

    @RequestMapping(value={"/delete"})
    @ResponseBody
    public JSONObject delete(Long userId) {
        JSONObject obj = null;
        try {
            String output;
            URL url = new URL(this.baseUrl + "/clear/" + userId);
            HttpURLConnection conn = (HttpURLConnection)url.openConnection();
            conn.setRequestMethod("DELETE");
            conn.setRequestProperty("Accept", "application/json");
            if (conn.getResponseCode() != 200) {
                throw new RuntimeException("Failed : HTTP error code : " + conn.getResponseCode());
            }
            BufferedReader br = new BufferedReader(new InputStreamReader(conn.getInputStream()));
            StringBuilder response = new StringBuilder();
            while ((output = br.readLine()) != null) {
                response.append(output);
                response.append('\n');
            }
            System.out.println("Response: " + response.toString());
            obj = (JSONObject)JSON.parse((String)response.toString());
            conn.disconnect();
        }
        catch (Exception e) {
            e.printStackTrace();
        }
        return obj;
    }
}

