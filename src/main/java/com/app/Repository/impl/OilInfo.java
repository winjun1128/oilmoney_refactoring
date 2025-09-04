package com.app.Repository.impl;

import java.io.BufferedReader;
import java.io.IOException;
import java.io.InputStream;
import java.io.InputStreamReader;
import java.net.HttpURLConnection;
import java.net.URL;
import java.net.URLEncoder;

public class OilInfo {
    
   public static String getOilInfo() throws IOException {
    String base = "https://safemap.go.kr/openApiService/data/getFluidenergyelctcfcltyData.do";
    StringBuilder urlBuilder = new StringBuilder(base)
        .append("?serviceKey=").append("GNYM7CHX-GNYM-GNYM-GNYM-GNYM7CHXB1") // Encoding키 그대로 (재인코딩 금지)
        .append("&pageNo=3")
        .append("&numOfRows=5000")
        .append("&dataType=json"); // 소문자

    URL url = new URL(urlBuilder.toString());
    HttpURLConnection conn = (HttpURLConnection) url.openConnection();
    conn.setInstanceFollowRedirects(false); // 리다이렉트 직접 확인
    conn.setRequestMethod("GET");
    conn.setRequestProperty("Accept", "application/json");
    conn.setRequestProperty("User-Agent", "Mozilla/5.0 (Java HttpURLConnection)"); // 일부 서버 우회
    conn.setConnectTimeout(5000);
    conn.setReadTimeout(10000);

    int code = conn.getResponseCode();
    String location = conn.getHeaderField("Location");
    String contentType = conn.getHeaderField("Content-Type");
    System.out.println("[SAFEMAP] URL=" + url + " status=" + code +
                       (location != null ? " Location=" + location : "") +
                       (contentType != null ? " CT=" + contentType : ""));

    InputStream is = (code >= 200 && code < 300) ? conn.getInputStream() : conn.getErrorStream();
    if (is == null) {
        throw new IOException("Safemap HTTP " + code + " (body 없음). URL=" + url +
                              (location != null ? " -> " + location : ""));
    }
    try (BufferedReader rd = new BufferedReader(new InputStreamReader(is, java.nio.charset.StandardCharsets.UTF_8))) {
        StringBuilder sb = new StringBuilder();
        for (String line; (line = rd.readLine()) != null; ) sb.append(line);
        String body = sb.toString();
        System.out.println("[SAFEMAP] body preview: " + body.substring(0, Math.min(200, body.length())));
        return body;
    } finally {
        conn.disconnect();
    }
   }

}
