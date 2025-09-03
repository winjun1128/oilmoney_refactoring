package com.app.controller.route;

import com.app.Repository.impl.EVInfoImpl;
import com.app.Repository.impl.EVStatus;
import com.app.Repository.impl.OilAvgPrice;
import com.app.Repository.impl.OilInfo;
import com.app.Repository.impl.OilPrice;
import com.app.Repository.parse.UniExtractor;
import com.app.dao.route.gas.GasStationDAO;
import com.app.dto.route.Charger;
import com.app.dto.route.GasStation;
import com.app.service.route.EvChargeService;
import com.app.service.route.GasStationService;
import com.app.service.route.impl.GasStationServiceImpl;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ObjectNode;
import com.fasterxml.jackson.dataformat.xml.XmlMapper;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.http.client.SimpleClientHttpRequestFactory;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.client.RestTemplate;     // ✅ RestClient → RestTemplate
import org.springframework.web.util.UriComponentsBuilder;
import org.springframework.web.util.UriUtils;

import java.nio.charset.StandardCharsets;
import java.time.format.DateTimeFormatter;
// import java.time.Duration;                      // ❌ 사용 안 함
import java.util.ArrayList;
import java.util.Arrays;
import java.util.HashSet;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.stream.Collectors;

import javax.servlet.http.HttpServletRequest;

@RestController
@RequestMapping("/api/route")
@RequiredArgsConstructor
public class EvOilProxyController {
	
	DateTimeFormatter FMT = DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm");
	
	@Autowired
	GasStationDAO gasStationDAO;
	
	@Autowired
	EvChargeService evChargeService;
	
	@Autowired
	GasStationService gasStationService;

  private static final Logger log = LoggerFactory.getLogger(EvOilProxyController.class);

  /** ✅ 타임아웃 설정된 RestTemplate (Spring 5/Boot 2 compatible) */
  private static RestTemplate buildTemplate() {
    SimpleClientHttpRequestFactory f = new SimpleClientHttpRequestFactory();
    f.setConnectTimeout(5_000);   // ms
    f.setReadTimeout(10_000);     // ms
    return new RestTemplate(f);
  }
  private final RestTemplate http = buildTemplate();   // ✅ 필드 타입 변경

  /** JSON 파서 & XML 파서 */
  private final ObjectMapper om = new ObjectMapper();
  private final XmlMapper xml = new XmlMapper();

  /** 공공데이터포털 키(인코딩/디코딩 키 아무거나 OK) */
  @Value("${app.ev.key}") String evKey;

  /** 오피넷 키 */
  @Value("${app.opinet.key}") String oilKey;

  /** 공백 제거 + 이미 인코딩된 키면 그대로, 아니면 1회 인코딩 */
  private String serviceKeyParam() {
    String raw = (evKey == null ? "" : evKey).trim();
    boolean looksEncoded = raw.contains("%2B") || raw.contains("%2F") || raw.contains("%3D");
    return looksEncoded ? raw : UriUtils.encode(raw, StandardCharsets.UTF_8);
  }
  
//  @GetMapping("/favs")
//  public Map<String,Object> getFavs(HttpServletRequest request) {
//    String token = JwtProvider.extractToken(request);
//    if (token == null || !JwtProvider.isVaildToken(token)) { /* 401 처리 */ }
//    String userId = JwtProvider.getUserIdFromToken(token);   // 발급 시 쓴 클레임명에 맞게 구현
//    var items = favs.findByUser(userId);
//    return Map.of("items", items);
//  }


  /* ───────────────── EV: XML → JSON 변환해서 반환 ───────────────── */

  /** 충전소 정보(XML 수신 → JSON 변환해서 반환) */
//  @GetMapping(value = "/ev/info", produces = MediaType.APPLICATION_JSON_VALUE)
//  public ResponseEntity<Map<String, Object>> evInfo() throws Exception {
//    String body = EVInfoImpl.getEvInfo();
//    Map<String, Object> map = om.readValue(body, new TypeReference<Map<String,Object>>(){});
//    return ResponseEntity.ok(map);
//  }
  @GetMapping(value = "/ev/info", produces = MediaType.APPLICATION_JSON_VALUE)
  public ResponseEntity<Map<String, Object>> evInfoFromDb(
      @RequestParam(required = false) String zcode,
      @RequestParam(required = false, name = "q") String nameLike
  ) {
    var list = evChargeService.findEvInfo(zcode, nameLike);

    Map<String, Object> payload = new LinkedHashMap<>();
    Map<String, Object> items = new LinkedHashMap<>();
    items.put("item", list);
    payload.put("items", items);

    return ResponseEntity.ok(payload);
  }

 

//  @GetMapping(value="/ev/status", produces = MediaType.APPLICATION_JSON_VALUE)
//  public ResponseEntity<Map<String, Object>> evStatus() throws Exception {
//    String body = EVStatus.getEVStatus();
//    Map<String, Object> map = om.readValue(body, new TypeReference<Map<String,Object>>(){});
//    return ResponseEntity.ok(map);
//  }
  
//  @GetMapping(value="/ev/status", produces = MediaType.APPLICATION_JSON_VALUE)
//  public ResponseEntity<Map<String, Object>> evStatusFiltered(
//      @RequestParam(defaultValue = "4") int pages  // 필요시 페이지 수 조절
//  ) throws Exception {
//
//    // 1) DB에서 유지할 statId 집합
//    Set<String> keepIds = new HashSet<>(
//        evChargeService.selectAllStatIds().stream()
//            .filter(s -> s != null && !s.isBlank())
//            .map(String::valueOf)
//            .collect(Collectors.toSet())
//    );
//
//    // 2) 외부 API 4페이지(5000 x 4) 호출해서 병합
//    List<Map<String, Object>> merged = new ArrayList<>();
//    // 중복 제거용 (statId + chgerId 기준)
//    Set<String> seen = new HashSet<>();
//
//    for (int i = 1; i <= pages; i++) {
//      String body = EVStatus.getEVStatus(i); // ← 질문에 주신 메서드 사용
//      JsonNode root = om.readTree(body);
//
//      // 일반적으로 { items: { item: [ ... ] } } 형태
//      JsonNode node = root.path("items").path("item");
//
//      if (node.isArray()) {
//        for (JsonNode it : node) {
//          String statId = firstText(it, "statId", "STAT_ID", "csId", "CS_ID");
//          String chgerId = firstText(it, "chgerId", "CHGER_ID", "chargerId");
//
//          if (statId == null || statId.isBlank()) continue;
//          if (!keepIds.contains(statId)) continue;           // ✅ DB에 있는 statId만 남김
//
//          String key = statId + "|" + (chgerId == null ? "" : chgerId);
//          if (!seen.add(key)) continue;                      // 중복 제거
//
//          // 노드를 Map으로 변환해서 누적
//          Map<String, Object> asMap = om.convertValue(it, new TypeReference<Map<String, Object>>() {});
//          merged.add(asMap);
//        }
//      } else if (node.isObject()) {
//        JsonNode it = node;
//        String statId = firstText(it, "statId", "STAT_ID", "csId", "CS_ID");
//        String chgerId = firstText(it, "chgerId", "CHGER_ID", "chargerId");
//        if (statId != null && keepIds.contains(statId)) {
//          String key = statId + "|" + (chgerId == null ? "" : chgerId);
//          if (seen.add(key)) {
//            merged.add(om.convertValue(it, new TypeReference<Map<String, Object>>() {}));
//          }
//        }
//      } else {
//        // 포맷이 다르면 원문도 참조할 수 있게 로그 정도
//        log.warn("[EV STATUS] unexpected payload on page {}", i);
//      }
//    }
//
//    // 3) 응답 형태 통일 (프론트에서 그대로 쓰던 형태 맞춤)
//    Map<String, Object> items = new LinkedHashMap<>();
//    items.put("item", merged);
//
//    Map<String, Object> payload = new LinkedHashMap<>();
//    payload.put("items", items);
//
//    return ResponseEntity.ok(payload);
//  }
  //
  @GetMapping(value="/ev/status/available", produces = MediaType.APPLICATION_JSON_VALUE)
  public ResponseEntity<Map<String, Object>> evAvailable(
      @RequestParam(required = false) String zcode,
      @RequestParam(defaultValue = "any") String type,
      @RequestParam(required = false) Integer minKw
  ) {
    List<String> ids = evChargeService.selectAvailableStatIds(zcode, type, minKw);

    List<Map<String,Object>> rows = ids.stream()
        .map(id -> Map.<String,Object>of("statId", id))
        .collect(Collectors.toList());

    Map<String,Object> items = new LinkedHashMap<>();
    items.put("item", rows);

    Map<String,Object> payload = new LinkedHashMap<>();
    payload.put("items", items);

    return ResponseEntity.ok(payload);
  }
  
  @GetMapping(value="/ev/status/by-station", produces = MediaType.APPLICATION_JSON_VALUE)
  public ResponseEntity<Map<String, Object>> evStatusByStation(
      @RequestParam(name = "statIds") String statIdsCsv
  ) {
    // 1) CSV → List (JDK 8/11 호환)
    List<String> statIds = Arrays.stream(statIdsCsv.split(","))
        .map(String::trim)
        .filter(s -> !s.isEmpty())
        .distinct()
        .collect(Collectors.toList());

    if (statIds.isEmpty()) {
      Map<String, Object> err = new LinkedHashMap<>();
      err.put("error", "statIds required");
      return ResponseEntity.badRequest().body(err);
    }

    // 2) DB 조회
    List<Map<String, Object>> rows = evChargeService.findChargerStatusByStatIds(statIds);

    // 3) 응답 래핑 (items.item 배열)
    Map<String, Object> items = new LinkedHashMap<>();
    items.put("item", rows);

    Map<String, Object> payload = new LinkedHashMap<>();
    payload.put("items", items);

    return ResponseEntity.ok(payload);
  }
  

//✅ 신규: 충전기 테이블 시드(2만건) - 스냅샷/상태는 돌리지 않음
 @GetMapping(value = "/ev/seed-chargers", produces = MediaType.APPLICATION_JSON_VALUE)
 public ResponseEntity<Map<String, Object>> seedChargers(
     @RequestParam(defaultValue = "44") String zcode,
     @RequestParam(defaultValue = "4")  int pages,        // 4페이지
     @RequestParam(defaultValue = "5000") int rows        // 5000행
 ) throws Exception {

   List<Charger> all = new ArrayList<>();
   Set<String> seen = new HashSet<>();

   for (int p = 1; p <= pages; p++) {
     String body = EVInfoImpl.getEvInfoPage(p, rows, zcode);

     // 일반적으로 { items: { item: [...] } } 형태
     JsonNode node = om.readTree(body).path("items").path("item");

     if (node.isArray()) {
       for (JsonNode it : node) {
         Charger c = toCharger(it);
         if (c == null) continue;
         String key = c.getStatId() + "|" + c.getChgerId();
         if (seen.add(key)) all.add(c);
       }
     } else if (node.isObject()) {
       Charger c = toCharger(node);
       if (c != null && seen.add(c.getStatId() + "|" + c.getChgerId())) all.add(c);
     }
   }

   // 대량 배치(너무 크면 쪼개서)
   int batch = 1000, merged = 0;
   for (int i = 0; i < all.size(); i += batch) {
     int end = Math.min(i + batch, all.size());
     List<Charger> slice = all.subList(i, end);
     evChargeService.mergeChargerBatch(slice);   // 👈 서비스에 이 메서드만 추가/연결하면 끝
     merged += slice.size();
   }

   Map<String, Object> resp = new LinkedHashMap<>();
   resp.put("zcode", zcode);
   resp.put("pages", pages);
   resp.put("rowsPerPage", rows);
   resp.put("uniqueChargers", all.size());
   resp.put("merged", merged);

   return ResponseEntity.ok(resp);
 }

 /** EV Info → Charger DTO 매핑 */
 private Charger toCharger(JsonNode it) {
   String statId  = firstText(it, "statId", "STAT_ID");
   String chgerId = firstText(it, "chgerId","CHGER_ID");
   if (isBlank(statId) || isBlank(chgerId)) return null;

   String typeCd  = firstText(it, "chgerType","CHGER_TYPE");  // 타입코드
   String method  = firstText(it, "method", "METHOD");        // 병렬/단독 등
   String outputS = firstText(it, "output", "OUTPUT");        // kW

   Double outputKw = null;
   try { if (!isBlank(outputS)) outputKw = Double.valueOf(outputS.trim()); } catch (Exception ignore) {}

   Charger c = new Charger();
   c.setStatId(statId);
   c.setChgerId(chgerId);
   c.setTypeCd(typeCd);
   c.setMethod(isBlank(method) ? "단독" : method);
   c.setOutputKw(outputKw);
   return c;
 }

 private static boolean isBlank(String s){ return s == null || s.isBlank(); }

 private static String firstText(JsonNode n, String... keys) {
   for (String k : keys) {
     JsonNode v = n.get(k);
     if (v != null && !v.isNull()) {
       String s = v.asText(null);
       if (s != null && !s.isBlank()) return s;
     }
   }
   return null;
 }


  /* ───────────────── 오피넷: 기존 그대로 JSON 반환 ───────────────── */

//  @GetMapping(value="/oil/info", produces = MediaType.APPLICATION_JSON_VALUE)
//  public ResponseEntity<Map<String, Object>> oilInfo() throws Exception {
//    String body = OilInfo.getOilInfo();
//    Map<String, Object> map = om.readValue(body, new TypeReference<Map<String,Object>>(){});
//    return ResponseEntity.ok(map);
//  }
  
	//com/app/controller/EvOilProxyController.java (혹은 별도 컨트롤러)
  @GetMapping(value="/oil/info", produces = MediaType.APPLICATION_JSON_VALUE)
  public ResponseEntity<Map<String, Object>> oilInfo(
          @RequestParam(required = false) String sidoCd,
          @RequestParam(required = false) String sigunCd) {

      Map<String, Object> payload = gasStationService.getAllFromDb(sidoCd, sigunCd);
      return ResponseEntity.ok(payload);
  }



  @GetMapping(value="/oil/price", produces = MediaType.APPLICATION_JSON_VALUE)
  public ResponseEntity<Map<String, Object>> oilPriceById(@RequestParam("id") String id) throws Exception {
    String body = OilPrice.getOilPrice(id);
    Map<String, Object> map = om.readValue(body, new TypeReference<Map<String,Object>>() {});
    return ResponseEntity.ok(map);
  }

  //사용못함 트래픽 넘음 1500개 밖에 안되서
//  @GetMapping(value="/oil/price/all", produces = MediaType.APPLICATION_JSON_VALUE)
//  public ResponseEntity<Map<String, Object>> oilPrice() throws Exception {
//    ObjectMapper om = new ObjectMapper();
//
//    // 1) UNI_CD 목록
//    String infoBody = OilInfo.getOilInfo();
//    List<String> uniList = gasStationService.selectAllUniCd();
//
//    // 2) 모든 주유소의 아이템을 누적할 리스트
//    List<Map<String, Object>> aggregatedItems = new ArrayList<>();
//
//    // 3) 주유소별 가격 API 호출 → items만 모아서 누적
//    for (String uni : uniList) {
//      try {
//        String body = OilPrice.getOilPrice(uni);
//
//        // 안전하게 탐색하기 위해 JsonNode 사용
//        JsonNode root = om.readTree(body);
//        JsonNode itemsNode = root.path("response").path("body").path("items");
//
//        if (itemsNode.isArray()) {
//          for (JsonNode it : itemsNode) {
//            if (it.isObject() && it.get("UNI_CD") == null) {
//              ((ObjectNode) it).put("UNI_CD", uni);
//            }
//            aggregatedItems.add(om.convertValue(it, new TypeReference<Map<String,Object>>(){ }));
//          }
//        }
//        else if (itemsNode.has("item")) {
//          JsonNode itemNode = itemsNode.get("item");
//          if (itemNode.isArray()) {
//            for (JsonNode it : itemNode) {
//              if (it.isObject() && it.get("UNI_CD") == null) {
//                ((ObjectNode) it).put("UNI_CD", uni);
//              }
//              aggregatedItems.add(om.convertValue(it, new TypeReference<Map<String,Object>>(){ }));
//            }
//          } else if (itemNode.isObject()) {
//            if (itemNode.get("UNI_CD") == null) {
//              ((ObjectNode) itemNode).put("UNI_CD", uni);
//            }
//            aggregatedItems.add(om.convertValue(itemNode, new TypeReference<Map<String,Object>>(){ }));
//          }
//        }
//        else if (itemsNode.isObject()) {
//          ObjectNode obj = (ObjectNode) itemsNode;
//          if (obj.get("UNI_CD") == null) obj.put("UNI_CD", uni);
//          aggregatedItems.add(om.convertValue(obj, new TypeReference<Map<String,Object>>(){ }));
//        } else {
//          Map<String,Object> whole = om.readValue(body, new TypeReference<Map<String,Object>>(){});
//          whole.put("UNI_CD", uni);
//          aggregatedItems.add(whole);
//        }
//      } catch (Exception e) {
//        // 실패한 UNI_CD는 스킵 (로그만 남김)
//        // log.warn("OilPrice 호출/파싱 실패 uni={}", uni, e);
//      }
//    }
//
//    Map<String, Object> header = new LinkedHashMap<>();
//    header.put("resultCode", "00");
//    header.put("resultMsg", "AGGREGATED SUCCESS");
//
//    Map<String, Object> body = new LinkedHashMap<>();
//    body.put("pageNo", 1);
//    body.put("numOfRows", aggregatedItems.size());
//    body.put("totalCount", aggregatedItems.size());
//    body.put("items", aggregatedItems);
//
//    Map<String, Object> response = new LinkedHashMap<>();
//    response.put("header", header);
//    response.put("body", body);
//
//    Map<String, Object> outer = new LinkedHashMap<>();
//    outer.put("response", response);
//
//    return ResponseEntity.ok(outer);
//  }
  
//  @GetMapping(value="/oil/price/all", produces = MediaType.APPLICATION_JSON_VALUE)
//  public ResponseEntity<Map<String,Object>> oilPriceAllFromDb() {
//    var rows = gasStationDAO.selectAllWithAnyPrice();
//
//    List<Map<String,Object>> items = new ArrayList<>();
//    for (var r : rows) {
//    	String ts = (r.getPriceUpdatedAt() == null)
//    		    ? null
//    		    : r.getPriceUpdatedAt().format(FMT);   // ✅ 끝
//      if (r.getPriceGasoline()!=null) items.add(Map.of("UNI_CD", r.getUniCd(),"PRODCD","B027","PRICE", r.getPriceGasoline(),"BASE_DT",ts));
//      if (r.getPriceDiesel()!=null)   items.add(Map.of("UNI_CD", r.getUniCd(),"PRODCD","D047","PRICE", r.getPriceDiesel(),"BASE_DT",ts));
//      if (r.getPricePremium()!=null)  items.add(Map.of("UNI_CD", r.getUniCd(),"PRODCD","B034","PRICE", r.getPricePremium(),"BASE_DT",ts));
//      if (r.getPriceKerosene()!=null) items.add(Map.of("UNI_CD", r.getUniCd(),"PRODCD","C004","PRICE", r.getPriceKerosene(),"BASE_DT",ts));
//      if (r.getPriceLpg()!=null)      items.add(Map.of("UNI_CD", r.getUniCd(),"PRODCD","K015","PRICE", r.getPriceLpg(),"BASE_DT",ts));
//    }
//    return ResponseEntity.ok(Map.of("response", Map.of("body", Map.of("items", items))));
//  }
//EvOilProxyController.java

@GetMapping(value="/oil/price/all", produces = MediaType.APPLICATION_JSON_VALUE)
public ResponseEntity<Map<String,Object>> oilPriceAllFromDb() {
 // 1) DB에서 충남(sido=05) 지점 전체 조회
 List<GasStation> list = gasStationDAO.selectAll("05", "");

 // 2) 등장하는 시군코드만 추려서 평균가를 한 번씩만 조회/캐싱
 Set<String> siguns = list.stream()
     .map(GasStation::getSigunCd)
     .filter(s -> s != null && !s.isBlank())
     .collect(Collectors.toCollection(java.util.LinkedHashSet::new));

 Map<String, Map<String, Integer>> avgBySigun = new java.util.HashMap<>();
 for (String sigun : siguns) {
   try {
     // prodcd=null → 전 계종 평균가 반환 (B027/D047/B034/C004/K015)
     String body = OilAvgPrice.getAvgSigunPrice("05", sigun, null, true);
     Map<String, Integer> perProd = parseAvgPerProd(body);  // 👈 아래 헬퍼
     avgBySigun.put(sigun, perProd);
   } catch (Exception e) {
     // 실패 시 빈 맵으로 채워두고 넘어감(그 시군 평균은 없음)
     avgBySigun.put(sigun, java.util.Collections.emptyMap());
   }
 }

 // 3) 응답 items 구성: 각 지점별로 {PRICES, AVG, DIFF} 패키징
 List<Map<String,Object>> items = new java.util.ArrayList<>();
 for (GasStation g : list) {
   Map<String, Integer> prices = new java.util.LinkedHashMap<>();
   putIfNotNull(prices, "B027", g.getPriceGasoline()); // 휘발유
   putIfNotNull(prices, "D047", g.getPriceDiesel());   // 경유
   putIfNotNull(prices, "B034", g.getPricePremium());  // 고급유
   putIfNotNull(prices, "C004", g.getPriceKerosene()); // 등유
   putIfNotNull(prices, "K015", g.getPriceLpg());      // LPG

   Map<String, Integer> avg = avgBySigun.getOrDefault(g.getSigunCd(),
       java.util.Collections.emptyMap());

   Map<String, Integer> diff = new java.util.LinkedHashMap<>();
   // union(지점가 키 ∪ 평균가 키) 기준으로 DIFF 채움
   java.util.Set<String> keys = new java.util.LinkedHashSet<>();
   keys.addAll(prices.keySet());
   keys.addAll(avg.keySet());
   for (String k : keys) {
     Integer p = prices.get(k), a = avg.get(k);
     if (p != null && a != null) diff.put(k, p - a);   // 지점-평균
   }

   Map<String, Object> row = new java.util.LinkedHashMap<>();
   row.put("UNI_CD", g.getUniCd());
   row.put("NAME", g.getName());
   row.put("BRAND", g.getBrand());
   row.put("SIGUN_CD", g.getSigunCd());
   row.put("LON", g.getLon());
   row.put("LAT", g.getLat());
   row.put("PRICES", prices); // {B027: 1655, D047: 1518, ...}
   row.put("AVG",    avg);    // {B027: 1660, D047: 1525, ...}
   row.put("DIFF",   diff);   // {B027: -5,   D047: -7,   ...}
   row.put("UPDATED_AT",
       g.getPriceUpdatedAt() == null ? null : g.getPriceUpdatedAt().format(FMT));

   items.add(row);
 }

 Map<String,Object> payload =
     Map.of("response", Map.of("body", Map.of("items", items)));
 return ResponseEntity.ok(payload);
}

/* ───── 헬퍼들 ───── */

private void putIfNotNull(Map<String,Integer> m, String k, Integer v) {
 if (v != null) m.put(k, v);
}

/** avgSigunPrice.do 응답 → {PRODCD → PRICE} 맵으로 파싱 */
private Map<String, Integer> parseAvgPerProd(String body) {
 Map<String, Integer> out = new java.util.LinkedHashMap<>();
 try {
   JsonNode root = om.readTree(body);

   // 보통: {"RESULT":{"OIL":[{"SIGUNCD":"0506","PRODCD":"B027","PRICE":1660,...}, ...]}}
   JsonNode arr = root.path("RESULT").path("OIL");
   if (arr.isMissingNode() || arr.isNull()) {
     // fallback(혹시 다른 래핑)
     JsonNode tmp = root.path("response").path("body").path("items");
     arr = tmp.has("item") ? tmp.get("item") : tmp;
   }

   if (arr.isArray()) {
	   for (JsonNode it : arr) {
	     String prod = text(it, "PRODCD", "prodcd");
	     Integer price = null;
	     JsonNode p = it.get("PRICE");
	     if (p != null && !p.isNull()) {
	       if (p.isNumber()) {
	         price = (int) Math.round(p.asDouble());
	       } else {
	         price = toInt(p.asText(null)); // "1656.80" 같은 문자열 대비
	       }
	     }
	     if (prod != null && price != null) out.put(prod, price);
	   }
	 } else if (arr.isObject()) {
	   String prod = text(arr, "PRODCD", "prodcd");
	   Integer price = null;
	   JsonNode p = arr.get("PRICE");
	   if (p != null && !p.isNull()) {
	     price = p.isNumber() ? (int) Math.round(p.asDouble()) : toInt(p.asText(null));
	   }
	   if (prod != null && price != null) out.put(prod, price);
	 }
   
 } catch (Exception ignore) {}
 return out;
}

private static Integer toInt(String s) {
	  if (s == null) return null;
	  s = s.replace(",", "").trim();
	  if (s.isEmpty() || "null".equalsIgnoreCase(s)) return null;
	  try {
	    // 소수점 허용 → 반올림해서 원 단위 정수로
	    double d = Double.parseDouble(s);
	    return (int) Math.round(d);
	  } catch (Exception e) {
	    return null;
	  }
	}

private static String text(JsonNode n, String... ks) {
 for (String k : ks) {
   JsonNode v = n.path(k);
   if (!v.isMissingNode() && !v.isNull()) {
     String s = v.asText().trim();
     if (!s.isEmpty() && !"null".equalsIgnoreCase(s)) return s;
   }
 }
 return null;
}



  @GetMapping(value="/oil/nearby", produces = MediaType.APPLICATION_JSON_VALUE)
  public Map<?,?> oilNearby(@RequestParam double lon,
                            @RequestParam double lat,
                            @RequestParam(defaultValue="2") int radiusKm) {
    String url = UriComponentsBuilder
        .fromHttpUrl("http://www.opinet.co.kr/api/aroundAll.do")
        .queryParam("code", oilKey)
        .queryParam("x", lon)
        .queryParam("y", lat)
        .queryParam("radius", radiusKm)
        .queryParam("out", "json")
        .toUriString();

    log.info("[OIL NEARBY] {}", url);
    String body = http.getForObject(url, String.class);   // ✅ RestTemplate 사용
    try { return om.readValue(body, Map.class); }
    catch (Exception e) { return Map.of("raw", body); }
  }
}
