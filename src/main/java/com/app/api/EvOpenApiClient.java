// src/main/java/com/app/api/EvOpenApiClient.java
package com.app.api;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.stereotype.Component;

import java.io.BufferedReader;
import java.io.InputStreamReader;
import java.net.HttpURLConnection;
import java.net.URL;
import java.nio.charset.StandardCharsets;

@Component
public class EvOpenApiClient {

  private static final String BASE_URL = "https://apis.data.go.kr/B552584/EvCharger";
  // ✅ 이미 URL-인코딩된 키를 그대로 넣으세요. (예: ...%2B...%3D%3D)
  private static final String SERVICE_KEY_ENC = "NeHfBKB065psaekMs%2B8nolE4vC60D2Cz516ji45M0QKe6r2%2BLO4mh%2Bq%2BfDFhJp0%2FrTodAaTptL8Q4aIGBtJERQ%3D%3D";

  private final ObjectMapper om = new ObjectMapper();

  // 기본 생성자(파라미터 없는 생성자)만 두면 Spring이 더 이상 String 주입 안 함
  public EvOpenApiClient() {}

  private String call(String url) throws Exception {
    System.out.println("EV GET " + url.replaceAll("(?<=serviceKey=.{6}).+?(?=&|$)", "****MASKED****"));
    HttpURLConnection conn = (HttpURLConnection) new URL(url).openConnection();
    conn.setConnectTimeout(10000);
    conn.setReadTimeout(20000);

    int code = conn.getResponseCode();
    try (BufferedReader br = new BufferedReader(
        new InputStreamReader(code >= 200 && code < 300 ? conn.getInputStream() : conn.getErrorStream(),
            StandardCharsets.UTF_8))) {
      StringBuilder sb = new StringBuilder();
      for (String line; (line = br.readLine()) != null; ) sb.append(line);
      String body = sb.toString();

      // data.go.kr은 오류 시 HTTP 200이어도 XML로 떨어짐 → 감지
      if (body.startsWith("<")) {
        String head = body.substring(0, Math.min(body.length(), 200));
        throw new RuntimeException("OpenAPI error code=" + code + " head=" + head);
      }
      return body;
    } finally {
      conn.disconnect();
    }
  }

  public JsonNode fetchInfoPage(int zcode, int pageNo, int rows) throws Exception {
    String url = BASE_URL + "/getChargerInfo"
        + "?serviceKey=" + SERVICE_KEY_ENC
        + "&dataType=JSON"
        + "&zcode=" + zcode
        + "&pageNo=" + pageNo
        + "&numOfRows=" + rows;

    var root = om.readTree(call(url));
    var items = root.path("response").path("body").path("items").path("item");
    if (items.isMissingNode() || items.isNull()) items = root.path("items").path("item"); // 폴백
    return items;
  }

  public JsonNode fetchStatusPage(int zcode, int periodMinutes, int pageNo, int rows) throws Exception {
    String url = BASE_URL + "/getChargerStatus"
        + "?serviceKey=" + SERVICE_KEY_ENC
        + "&dataType=JSON"
        + "&zcode=" + zcode
        + "&period=" + periodMinutes
        + "&pageNo=" + pageNo
        + "&numOfRows=" + rows;

    var root = om.readTree(call(url));
    var items = root.path("response").path("body").path("items").path("item");
    if (items.isMissingNode() || items.isNull()) items = root.path("items").path("item");
    return items;
  }
}
