package com.app.controller.route;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.*;
import org.springframework.http.client.SimpleClientHttpRequestFactory;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.client.RestTemplate;
import org.springframework.web.util.UriComponentsBuilder;

import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.util.*;

@RestController
@RequestMapping("/api")
public class MapProxyController {

  // ✅ RestTemplate (timeout 설정)
  private static RestTemplate buildTemplate() {
    var f = new SimpleClientHttpRequestFactory();
    f.setConnectTimeout(5_000);
    f.setReadTimeout(10_000);
    return new RestTemplate(f);
  }
  private final RestTemplate http = buildTemplate();

  @Value("${app.kakao.restKey}")      String restKey;
  @Value("${app.kakao.mobilityKey:}") String mobKey; // 없으면 빈값

  @GetMapping("/health")
  public String health() { return "OK"; }

  // ----- 공통: Kakao Authorization 헤더로 GET -----
  private Map<String,Object> kakaoGet(String url, String key) {
    HttpHeaders h = new HttpHeaders();
    h.set("Authorization", "KakaoAK " + key);
    ResponseEntity<Map> res =
        http.exchange(url, HttpMethod.GET, new HttpEntity<>(h), Map.class);
    return res.getBody();
  }

  // 주소/장소 → 좌표 (keyword 우선, 없으면 address로 폴백)
  @GetMapping(value="/geocode", produces = MediaType.APPLICATION_JSON_VALUE)
  public Map<String,Object> geocode(@RequestParam String query) {
    String q = URLEncoder.encode(query, StandardCharsets.UTF_8);
    String kwUrl   = "https://dapi.kakao.com/v2/local/search/keyword.json?size=1&query=" + q;
    Map<String,Object> r1 = kakaoGet(kwUrl, restKey);

    List<?> docs = (List<?>) r1.getOrDefault("documents", List.of());
    if (docs == null || docs.isEmpty()) {
      String addrUrl = "https://dapi.kakao.com/v2/local/search/address.json?size=1&query=" + q;
      return kakaoGet(addrUrl, restKey);
    }
    return r1;
  }

  // 경로 탐색
  @GetMapping(value="/route", produces = MediaType.APPLICATION_JSON_VALUE)
  public Map<String,Object> route(@RequestParam String origin,
                                  @RequestParam String destination,
                                  @RequestParam(required=false) String waypoints) {
    String key = (mobKey != null && !mobKey.isBlank()) ? mobKey : restKey;
    if (key == null || key.isBlank())
      throw new IllegalStateException("카카오 REST 키가 설정되지 않았습니다.");

    String url = UriComponentsBuilder
        .fromHttpUrl("https://apis-navi.kakaomobility.com/v1/directions")
        .queryParam("origin", origin)                 // "경도,위도"
        .queryParam("destination", destination)       // "경도,위도"
        .queryParamIfPresent("waypoints", Optional.ofNullable(waypoints))
        .toUriString();

    return kakaoGet(url, key);
  }
}
