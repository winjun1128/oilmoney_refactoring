package com.app.Repository.impl;

import java.io.BufferedReader;
import java.io.IOException;
import java.io.InputStreamReader;
import java.net.HttpURLConnection;
import java.net.MalformedURLException;
import java.net.URL;
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;


public class EVInfoImpl  {
    private static final String SERVICE_KEY = "NeHfBKB065psaekMs%2B8nolE4vC60D2Cz516ji45M0QKe6r2%2BLO4mh%2Bq%2BfDFhJp0%2FrTodAaTptL8Q4aIGBtJERQ%3D%3D";
 
 public static String getEvInfo() throws IOException{
     StringBuilder urlBuilder = new StringBuilder("http://apis.data.go.kr/B552584/EvCharger/getChargerInfo"); /*URL*/
        urlBuilder.append("?" + URLEncoder.encode("serviceKey","UTF-8") + "=NeHfBKB065psaekMs%2B8nolE4vC60D2Cz516ji45M0QKe6r2%2BLO4mh%2Bq%2BfDFhJp0%2FrTodAaTptL8Q4aIGBtJERQ%3D%3D"); /*Service Key*/
        urlBuilder.append("&" + URLEncoder.encode("pageNo","UTF-8") + "=" + URLEncoder.encode("1", "UTF-8")); /*페이지번호*/
        urlBuilder.append("&" + URLEncoder.encode("numOfRows","UTF-8") + "=" + URLEncoder.encode("5000", "UTF-8")); /*한 페이지 결과 수 (최소 10, 최대 9999)*/
        urlBuilder.append("&" + URLEncoder.encode("zcode","UTF-8") + "=" + URLEncoder.encode("44", "UTF-8")); /*시도 코드 (행정구역코드 앞 2자리)*/
        urlBuilder.append("&dataType=JSON");
        URL url = new URL(urlBuilder.toString());
        HttpURLConnection conn = (HttpURLConnection) url.openConnection();
        conn.setRequestMethod("GET");
        conn.setRequestProperty("Content-type", "application/json");
        System.out.println("Response code: " + conn.getResponseCode());
        BufferedReader rd;
        if(conn.getResponseCode() >= 200 && conn.getResponseCode() <= 300) {
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
 
 /** ✅ 새 메서드: 페이지/행수/zcode 받기 */
 public static String getEvInfoPage(int pageNo, int numOfRows, String zcode) throws IOException {
     StringBuilder urlBuilder = new StringBuilder("http://apis.data.go.kr/B552584/EvCharger/getChargerInfo");
     urlBuilder.append("?serviceKey=").append(SERVICE_KEY);
     urlBuilder.append("&pageNo=").append(pageNo);
     urlBuilder.append("&numOfRows=").append(numOfRows);       // 최소 10, 최대 9999
     urlBuilder.append("&zcode=").append(URLEncoder.encode(zcode, "UTF-8"));
     urlBuilder.append("&dataType=JSON");

     URL url = new URL(urlBuilder.toString());
     HttpURLConnection conn = (HttpURLConnection) url.openConnection();
     conn.setConnectTimeout(10_000);
     conn.setReadTimeout(20_000);
     conn.setRequestMethod("GET");
     conn.setRequestProperty("Content-type", "application/json");

     try (BufferedReader rd = new BufferedReader(new InputStreamReader(
             conn.getResponseCode() >= 200 && conn.getResponseCode() < 300
                     ? conn.getInputStream() : conn.getErrorStream(), java.nio.charset.StandardCharsets.UTF_8))) {
         StringBuilder sb = new StringBuilder();
         for (String line; (line = rd.readLine()) != null; ) sb.append(line);
         return sb.toString();
     } finally {
         conn.disconnect();
     }
 }
    
}
