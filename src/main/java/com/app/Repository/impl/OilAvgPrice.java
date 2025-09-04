package com.app.Repository.impl;

import java.io.BufferedReader;
import java.io.IOException;
import java.io.InputStream;
import java.io.InputStreamReader;
import java.net.HttpURLConnection;
import java.net.URL;

public class OilAvgPrice {
	// com.app.Repository.impl.OilPrice 안에 추가
	public static String getAvgSigunPrice(String sidoCd, String sigunCd, String prodcd, boolean debug) throws IOException {
	    final String BASE = "https://www.opinet.co.kr/api/avgSigunPrice.do";
	    final String CODE = "F250903768"; // 인코딩키(재인코딩 금지)
	    StringBuilder urlBuilder = new StringBuilder(BASE)
	            .append("?code=").append(CODE)
	            .append("&out=json")
	            .append("&sido=").append(sidoCd == null ? "" : sidoCd)
	            .append("&sigun=").append(sigunCd == null ? "" : sigunCd);
	    if (prodcd != null && !prodcd.isBlank()) {
	        // B027:휘발유, D047:경유, B034:고급유, C004:등유, K015:LPG
	        urlBuilder.append("&prodcd=").append(prodcd);
	    }

	    URL url = new URL(urlBuilder.toString());
	    HttpURLConnection conn = (HttpURLConnection) url.openConnection();
	    conn.setInstanceFollowRedirects(false);
	    conn.setRequestMethod("GET");
	    conn.setRequestProperty("Accept", "application/json");
	    conn.setRequestProperty("User-Agent", "Mozilla/5.0 (Java HttpURLConnection)");
	    conn.setConnectTimeout(5000);
	    conn.setReadTimeout(10000);

	    int status = conn.getResponseCode();
	    if (debug) {
	        String location = conn.getHeaderField("Location");
	        String ct = conn.getHeaderField("Content-Type");
	        System.out.println("[AVG] URL=" + url + " status=" + status +
	                (location != null ? " Location=" + location : "") +
	                (ct != null ? " CT=" + ct : ""));
	    }

	    InputStream is = (status >= 200 && status < 300) ? conn.getInputStream() : conn.getErrorStream();
	    if (is == null) {
	        conn.disconnect();
	        throw new IOException("avgSigunPrice HTTP " + status + " (body 없음). URL=" + url);
	    }

	    String body;
	    try (BufferedReader br = new BufferedReader(
	            new InputStreamReader(is, java.nio.charset.StandardCharsets.UTF_8))) {
	        StringBuilder sb = new StringBuilder();
	        for (String line; (line = br.readLine()) != null; ) sb.append(line);
	        body = sb.toString();
	    } finally {
	        conn.disconnect();
	    }

	    if (debug) {
	        int charLen = body.length();
	        int byteLen = body.getBytes(java.nio.charset.StandardCharsets.UTF_8).length;
	        String head = body.substring(0, Math.min(200, charLen));
	        String tail = body.substring(Math.max(0, charLen - 400));
	        System.out.println("[AVG body head] " + head);
	        System.out.println("[AVG raw len] chars=" + charLen + " bytes=" + byteLen);
	        System.out.println("[AVG tail] " + tail);
	        // 대강 아이템 감지(로그용)
	        int items = body.split("\"PRODCD\"").length - 1;
	        System.out.println("[AVG] items(probable)=" + Math.max(items, 0));
	    }

	    return body;
	}

	/** 편의 오버로드: prodcd 없이 전체(문서에 ‘미입력시 전 계종 조회’) */
	public static String getAvgSigunPrice(String sidoCd, String sigunCd) throws IOException {
	    return getAvgSigunPrice(sidoCd, sigunCd, null, true);
	}

	/** 편의 오버로드: 로그 끄고 단일 계종 */
	public static String getAvgSigunPrice(String sidoCd, String sigunCd, String prodcd) throws IOException {
	    return getAvgSigunPrice(sidoCd, sigunCd, prodcd, true);
	}


}
