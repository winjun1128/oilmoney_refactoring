package com.app.service.route.impl;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.app.Repository.impl.OilPrice;
import com.app.dao.route.gas.GasStationDAO;
import com.app.dto.route.GasStation;
import com.app.service.route.GasStationService;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;

@Service
public class GasStationServiceImpl implements GasStationService {
	
	private final ObjectMapper om = new ObjectMapper();
	
	@Autowired
	GasStationDAO gasStationDAO;
	
	public Map<String,Object> getAllFromDb(String sidoCd, String sigunCd) {
	    List<GasStation> items = gasStationDAO.selectAll(sidoCd, sigunCd);
	    int total = items.size();

	    Map<String,Object> header = new HashMap<>();
	    header.put("resultCode", "00");
	    header.put("resultMsg",  "DB SUCCESS");

	    Map<String,Object> body = new HashMap<>();
	    body.put("pageNo", 1);
	    body.put("numOfRows", total);
	    body.put("totalCount", total);
	    body.put("items", items);

	    Map<String,Object> response = new HashMap<>();
	    response.put("header", header);
	    response.put("body", body);

	    Map<String,Object> outer = new HashMap<>();
	    outer.put("response", response);
	    return outer;
	  }

	@Override
	public List<String> selectAllUniCd() {
		return gasStationDAO.selectAllUniCd();
	}

	@Override
	@Transactional
	public int refreshAllOilPrices() {
	  String sidoCd = "05";
	  List<String> unis = gasStationDAO.selectUniCdBySido(sidoCd);
	  int updated = 0;

	  for (String uni : unis) {
	    try {
	      String raw = OilPrice.getOilPrice(uni);
	      JsonNode items = extractItems(raw); // RESULT.OIL 우선

	      // ✅ 재시도 없음: 비어 있으면 즉시 스킵
	      if (items == null || !items.isArray() || items.size() == 0) {
	        continue;
	      }

	      // ✅ 안전장치: 응답의 UNI_ID가 있고 요청 uni와 다르면 스킵
	      JsonNode first = items.get(0);
	      String uniInResp = txt(first, "UNI_ID");
	      if (uniInResp != null && !uni.equals(uniInResp)) {
	        continue;
	      }

	      Integer gas=null, diesel=null, premium=null, kerosene=null, lpg=null;
	      String baseTs = null;

	      if (items.size() == 1 && !first.has("PRODCD")) {
	        // ▼ 형태C: OIL[0].OIL_PRICE 배열(중첩) 먼저 처리
	        JsonNode nested = first.path("OIL_PRICE");
	        if (nested.isArray() && nested.size() > 0) {
	          for (JsonNode it : nested) {
	            String prod = it.path("PRODCD").asText(null);
	            Integer price = toInt(it.path("PRICE").asText(null));
	            if (prod != null) {
	              switch (prod) {
	                case "B027": gas      = price; break;
	                case "D047": diesel   = price; break;
	                case "B034": premium  = price; break;
	                case "C004": kerosene = price; break;
	                case "K015": lpg      = price; break;
	              }
	            }
	            String dt = txt(it, "BASE_DT", "TRADE_DT");
	            String tm = txt(it, "TRADE_TM", "TRADE_TIME");
	            if (dt != null) baseTs = (tm == null ? dt : dt + tm);
	          }
	        } else {
	          // 형태B: *_PRC 필드
	          gas      = toInt(first.path("B027_PRC").asText(null));
	          diesel   = toInt(first.path("D047_PRC").asText(null));
	          premium  = toInt(first.path("B034_PRC").asText(null));
	          kerosene = toInt(first.path("C004_PRC").asText(null));
	          lpg      = toInt(first.path("K015_PRC").asText(null));

	          String dt = txt(first, "BASE_DT", "TRADE_DT");
	          String tm = txt(first, "TRADE_TM", "TRADE_TIME");
	          if (dt != null) baseTs = (tm == null ? dt : dt + tm);
	        }
	      } else {
	        // 형태A: RESULT.OIL 배열에 품목행이 직접 들어있는 케이스
	        for (JsonNode it : items) {
	          String prod = it.path("PRODCD").asText(null);
	          Integer price = toInt(it.path("PRICE").asText(null));
	          if (prod != null) {
	            switch (prod) {
	              case "B027": gas      = price; break;
	              case "D047": diesel   = price; break;
	              case "B034": premium  = price; break;
	              case "C004": kerosene = price; break;
	              case "K015": lpg      = price; break;
	            }
	          }
	          String dt = txt(it, "BASE_DT", "TRADE_DT");
	          String tm = txt(it, "TRADE_TM", "TRADE_TIME");
	          if (dt != null) baseTs = (tm == null ? dt : dt + tm);
	        }
	      }

	      // 모두 null이면 DB 업데이트 생략(기존값 보호)
	      if (gas==null && diesel==null && premium==null && kerosene==null && lpg==null) {
	        continue;
	      }

	      gasStationDAO.updatePrices(uni, gas, diesel, premium, kerosene, lpg, baseTs);
	      updated++;

	      // 과호출 방지용 약간의 지터 (원하면 제거 가능)
	      Thread.sleep(150 + (int)(Math.random()*150));
	    } catch (Exception ignore) {
	      // 로그만 남기고 다음
	    }
	  }
	  return updated;
	}

	private JsonNode extractItems(String raw) throws Exception {
	  JsonNode root = om.readTree(raw);
	  // ✅ 오피넷 포맷
	  JsonNode items = root.path("RESULT").path("OIL");
	  // ✅ 혹시 다른 포맷이면 fallback
	  if (items.isMissingNode() || items.isNull()) {
	    JsonNode tmp = root.path("response").path("body").path("items");
	    items = tmp.has("item") ? tmp.get("item") : tmp;
	  }
	  return items;
	}

	private static Integer toInt(String s){
	  try{
	    return s==null?null:Integer.valueOf(s.replace(",","").trim());
	  }catch(Exception e){
	    return null;
	  }
	}
	private static String txt(JsonNode n, String... ks){
	  for (String k: ks){
	    var v = n.path(k);
	    if(!v.isMissingNode() && !v.isNull()){
	      var s = v.asText().trim();
	      if(!s.isEmpty() && !"null".equalsIgnoreCase(s)) return s;
	    }
	  }
	  return null;
	}
}
