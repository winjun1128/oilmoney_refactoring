package com.app.controller.api;

import java.io.BufferedReader;
import java.io.IOException;
import java.io.InputStreamReader;
import java.net.HttpURLConnection;
import java.net.URL;
import java.net.URLEncoder;
import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.Set;

import org.json.simple.JSONArray;
import org.json.simple.JSONObject;
import org.json.simple.parser.JSONParser;

import com.app.dto.ChargeDTO;

public class EVInfo {

	public static String getEvInfo(int page) throws IOException {
		StringBuilder urlBuilder = new StringBuilder(
				"http://apis.data.go.kr/B552584/EvCharger/getChargerInfo"); /* URL */
		urlBuilder.append("?" + URLEncoder.encode("serviceKey", "UTF-8")
				+ "=9%2FrVQNUrrD74vHUHYK%2Bau7E3Bgqd8Nko3F0%2Ft8hCl%2Fj4jB4ldy6f%2F%2FAQAYXXcG7nZGneRTyXFm7Rq02V2MAquQ%3D%3D");
		urlBuilder
				.append("&" + URLEncoder.encode("pageNo", "UTF-8") + "=" + URLEncoder.encode(""+page, "UTF-8")); /* 페이지번호 */
		urlBuilder.append("&" + URLEncoder.encode("numOfRows", "UTF-8") + "="
				+ URLEncoder.encode("100", "UTF-8")); /* 한 페이지 결과 수 (최소 10, 최대 9999) */
		urlBuilder.append("&" + URLEncoder.encode("zcode", "UTF-8") + "="
				+ URLEncoder.encode("44", "UTF-8")); /* 시도 코드 (행정구역코드 앞 2자리) */
		urlBuilder.append("&dataType=JSON");
		URL url = new URL(urlBuilder.toString());
		HttpURLConnection conn = (HttpURLConnection) url.openConnection();
		conn.setRequestMethod("GET");
		conn.setRequestProperty("Content-type", "application/json");
		System.out.println("Response code: " + conn.getResponseCode());
		BufferedReader rd;
		if (conn.getResponseCode() >= 200 && conn.getResponseCode() <= 300) {
			rd = new BufferedReader(new InputStreamReader(conn.getInputStream()));
		} else {
			rd = new BufferedReader(new InputStreamReader(conn.getErrorStream()));
		}
		StringBuilder sb = new StringBuilder();
		String line;
		while ((line = rd.readLine()) != null) {
			sb.append(line);
		}
		rd.close();
		conn.disconnect();
		System.out.println(sb.toString());
		return sb.toString();
	}

	public List<ChargeDTO> findCharge(int page) {
	    List<ChargeDTO> chargeList = new ArrayList<>();

	    try {
	        String jsonString = getEvInfo(page);

	        JSONParser jsonParser = new JSONParser();
	        JSONObject root = (JSONObject) jsonParser.parse(jsonString);

	        JSONObject items = (JSONObject) root.get("items");
	        if (items == null) return chargeList;

	        Object itemAny = items.get("item"); // 배열 또는 단일 객체
	        if (itemAny == null) return chargeList;

	        List<JSONObject> rows = new ArrayList<>();
	        if (itemAny instanceof JSONArray) {
	            JSONArray arr = (JSONArray) itemAny;
	            for (Object o : arr) if (o instanceof JSONObject) rows.add((JSONObject) o);
	        } else if (itemAny instanceof JSONObject) {
	            rows.add((JSONObject) itemAny);
	        }

	        // 같은 응답 내 statId 중복 제거
	        Set<String> seenStatIds = new HashSet<>();

	        for (JSONObject jo : rows) {
	            String statId = s(jo.get("statId"));
	            if (statId.isEmpty()) continue;
	            if (!seenStatIds.add(statId)) continue; // 중복 statId 스킵

	            // 원본 값 뽑기
	            String statNm   = s(jo.get("statNm"));
	            String addr     = s(jo.get("addr"));
	            String lat      = s(jo.get("lat"));
	            String lng      = s(jo.get("lng"));
	            String useTime  = s(jo.get("useTime"));
	            String zcode    = s(jo.get("zcode"));
	            String scode    = s(jo.get("zscode"));
	            String floorNumRaw  = s(jo.get("floorNum"));
	            String floorTypeRaw = s(jo.get("floorType"));
	            String busId    = s(jo.get("busiId"));
	            String busiNm   = s(jo.get("busiNm"));
	            String busiCall = s(jo.get("busiCall"));

	            // 정규화 & 길이제한
	            String floorType = clip(normalizeFloorType(floorTypeRaw, floorNumRaw), 1);
	            String floorNum  = clip(normalizeFloorNum(floorNumRaw), 2);

	            statId   = clip(statId,   20);
	            statNm   = clip(statNm,  100);
	            addr     = clip(addr,    500);
	            lat      = clip(lat,      15);
	            lng      = clip(lng,      15);
	            useTime  = clip(useTime,   50);
	            zcode    = clip(zcode,     2);
	            scode    = clip(scode,     5);
	            busId    = clip(busId,    10);
	            busiNm   = clip(busiNm,  100);
	            busiCall = clip(busiCall,100);

	            // NOT NULL 컬럼이 하나라도 비면 해당 행 스킵(무결성 위반 방지)
	            if (anyEmpty(statId, statNm, addr, lat, lng, useTime, zcode, scode, floorNum, floorType, busId, busiNm, busiCall)) {
	                continue;
	            }

	            ChargeDTO dto = new ChargeDTO();
	            dto.setStatId(statId);
	            dto.setStatNm(statNm);
	            dto.setAddr(addr);
	            dto.setLat(lat);
	            dto.setLng(lng);
	            dto.setUseTime(useTime);
	            dto.setZcode(zcode);
	            dto.setScode(scode);
	            dto.setFloorNum(floorNum);
	            dto.setFloorType(floorType);
	            dto.setBusId(busId);
	            dto.setBusiNm(busiNm);
	            dto.setBusiCall(busiCall);
	            // updated_at은 DB default

	            chargeList.add(dto);
	        }
	    } catch (Exception e) {
	        e.printStackTrace();
	    }

	    return chargeList;
	}

	/** null 또는 "null" → "" */
	private static String s(Object v) {
	    if (v == null) return "";
	    String out = String.valueOf(v).trim();
	    return "null".equalsIgnoreCase(out) ? "" : out;
	}

	/** 하나라도 빈 값이면 true (Oracle은 빈 문자열을 NULL로 봄) */
	private static boolean anyEmpty(String... arr) {
	    for (String v : arr) if (v == null || v.isEmpty()) return true;
	    return false;
	}

	/** 지정한 글자수로 자르기(넘치면 잘라서 길이 초과 에러 방지) */
	private static String clip(String v, int maxLen) {
	    if (v == null) return "";
	    return v.length() > maxLen ? v.substring(0, maxLen) : v;
	}

	/** 층타입 정규화: 없으면 floorNum 힌트로 추정 */
	private static String normalizeFloorType(String floorType, String floorNumRaw) {
	    String ft = s(floorType).toUpperCase();
	    if (ft.equals("F") || ft.equals("B")) return ft; // 그대로 사용
	    String raw = s(floorNumRaw);
	    if (raw.contains("B") || raw.contains("지하")) return "B";
	    return "F"; // 기본 지상
	}

	/** 층수 정규화: 숫자만 추출, '옥상' 등은 RF 로 치환 */
	private static String normalizeFloorNum(String floorNumRaw) {
	    String v = s(floorNumRaw);
	    if (v.isEmpty()) return "1";           // 기본 1층
	    if (v.contains("옥")) return "RF";     // 옥상 → Roof
	    // 숫자만 추출 (예: "지하4층" → "4", "B3" → "3")
	    String digits = v.replaceAll("[^0-9]", "");
	    if (!digits.isEmpty()) return digits;
	    // 숫자가 전혀 없으면 1로
	    return "1";
	}
}