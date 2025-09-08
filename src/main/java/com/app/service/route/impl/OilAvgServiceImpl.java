package com.app.service.route.impl;

import java.util.ArrayList;
import java.util.Collections;
import java.util.HashMap;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.stream.Collectors;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.app.dao.route.gas.OilAvgDAO;
import com.app.dto.route.OilAvgPriceRow;
import com.app.service.route.OilAvgService;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;

@Service
public class OilAvgServiceImpl implements OilAvgService {
	
	@Autowired
	OilAvgDAO oilAvgDAO;
	
	 private final ObjectMapper om = new ObjectMapper();

	// 외부 API 응답(JSON 문자열) -> {PRODCD -> PRICE}
	  public Map<String,Integer> parseAvgPerProd(String body) {
	    Map<String,Integer> out = new LinkedHashMap<>();
	    try {
	      JsonNode root = om.readTree(body);
	      JsonNode arr = root.path("RESULT").path("OIL");
	      if (arr.isMissingNode() || arr.isNull()) {
	        JsonNode tmp = root.path("response").path("body").path("items");
	        arr = tmp.has("item") ? tmp.get("item") : tmp;
	      }
	      if (arr.isArray()) {
	        for (JsonNode it : arr) push(out, it);
	      } else if (arr.isObject()) {
	        push(out, arr);
	      }
	    } catch (Exception ignore) {}
	    return out;
	  }

	  private static void push(Map<String,Integer> out, JsonNode it) {
	    String prod = text(it, "PRODCD","prodcd");
	    Integer price = toInt(it.path("PRICE").asText(null));
	    if (prod != null && price != null) out.put(prod, price);
	  }

	  private static Integer toInt(String s) {
	    if (s == null) return null;
	    s = s.replace(",", "").trim();
	    if (s.isEmpty() || "null".equalsIgnoreCase(s)) return null;
	    try { return (int)Math.round(Double.parseDouble(s)); }
	    catch (Exception e) { return null; }
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

	  /** 여러 시군 평균가 조회: sigun -> {prod -> price} */
	  public Map<String, Map<String,Integer>> findAvgBySiguns(String sidoCd, Set<String> siguns) {
	    if (siguns == null || siguns.isEmpty()) return Collections.emptyMap();
	    var rows = oilAvgDAO.selectBySiguns(sidoCd, new ArrayList<>(siguns));
	    Map<String, Map<String,Integer>> map = new HashMap<>();
	    for (OilAvgPriceRow r : rows) {
	      map.computeIfAbsent(r.getSigunCd(), k -> new LinkedHashMap<>()).put(r.getProdcd(), r.getPrice());
	    }
	    return map;
	  }

	  /** 외부에서 받아온 한 시군 평균가를 DB에 업서트 */
	  @Transactional
	  public void upsertOneSigun(String sidoCd, String sigunCd, String rawJson) {
	    Map<String,Integer> perProd = parseAvgPerProd(rawJson);
	    if (perProd.isEmpty()) return;

	    List<OilAvgPriceRow> rows = perProd.entrySet().stream()
	        .map(e -> OilAvgPriceRow.builder()
	            .sidoCd(sidoCd).sigunCd(sigunCd)
	            .prodcd(e.getKey()).price(e.getValue())
	            .build())
	        .collect(Collectors.toList());

	    oilAvgDAO.mergeBatch(rows);
	  }

}
