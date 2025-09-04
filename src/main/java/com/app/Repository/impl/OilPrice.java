package com.app.Repository.impl;

import java.io.BufferedReader;
import java.io.IOException;
import java.io.InputStream;
import java.io.InputStreamReader;
import java.net.HttpURLConnection;
import java.net.URL;

public class OilPrice {
	public static String getOilPrice(String uniId) throws IOException {
	    String base = "https://www.opinet.co.kr/api/detailById.do";
	    StringBuilder urlBuilder = new StringBuilder(base)
	        .append("?code=").append("F250903765")
	        .append("&id=").append(uniId)
	        .append("&out=json");

	    URL url = new URL(urlBuilder.toString());
	    HttpURLConnection conn = (HttpURLConnection) url.openConnection();
	    conn.setInstanceFollowRedirects(false);
	    conn.setRequestMethod("GET");
	    conn.setRequestProperty("Accept", "application/json");
	    conn.setRequestProperty("User-Agent", "Mozilla/5.0 (Java HttpURLConnection)");
	    conn.setConnectTimeout(5000);
	    conn.setReadTimeout(10000);

	    int code = conn.getResponseCode();
	    String location   = conn.getHeaderField("Location");
	    String contentType= conn.getHeaderField("Content-Type");
	    System.out.println("[SAFEMAP] URL=" + url + " status=" + code +
	        (location != null ? " Location=" + location : "") +
	        (contentType != null ? " CT=" + contentType : ""));

	    InputStream is = (code >= 200 && code < 300) ? conn.getInputStream() : conn.getErrorStream();
	    if (is == null) {
	        throw new IOException("Safemap HTTP " + code + " (body 없음). URL=" + url +
	            (location != null ? " -> " + location : ""));
	    }
	    try (BufferedReader rd = new BufferedReader(
	            new InputStreamReader(is, java.nio.charset.StandardCharsets.UTF_8))) {
	        StringBuilder sb = new StringBuilder();
	        for (String line; (line = rd.readLine()) != null; ) sb.append(line);
	        String body = sb.toString();

	        // ---- 여기부터 추가 로그 ----
	        int charLen  = body.length();
	        int byteLen  = body.getBytes(java.nio.charset.StandardCharsets.UTF_8).length;
	        String head  = body.substring(0, Math.min(200, charLen));
	        String tail  = body.substring(Math.max(0, charLen - 400));

	        System.out.println("[SAFEMAP] body head: " + head);
	        System.out.println("[OIL raw len] id=" + uniId + " chars=" + charLen + " bytes=" + byteLen);
	        System.out.println("[OIL tail] id=" + uniId + " " + tail);

	        // (선택) 응답 안의 UNI_ID가 다르면 눈에 띄게 표시
	        int i = body.indexOf("\"UNI_ID\":\"");
	        if (i >= 0) {
	            int s = i + "\"UNI_ID\":\"".length();
	            int e = body.indexOf('"', s);
	            if (e > s) {
	                String uniInResp = body.substring(s, e);
	                if (!uniId.equals(uniInResp)) {
	                    System.out.println("[WARN] UNI_ID mismatch: request=" + uniId + " resp=" + uniInResp);
	                }
	            }
	        }
	        // (선택) 빈 배열 여부 빠르게 표시
	        if (body.contains("\"OIL\":[") && body.contains("\"OIL\":[]")) {
	            System.out.println("[INFO] OIL array is EMPTY for id=" + uniId);
	        }
	        // ---- 추가 로그 끝 ----

	        return body;
	    } finally {
	        conn.disconnect();
	    }
	}

}
