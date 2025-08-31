package com.app.controller;

import java.io.IOException;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.app.controller.api.OilPriceAPI;
import com.app.dto.ChargeDTO;
import com.app.dto.ChargeSearchDTO;
import com.app.dto.OilSearchDTO;
import com.app.dto.StationDTO;
import com.app.service.Oil.OilService;
import com.app.service.charge.ChargeService;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;

@RestController
public class ReactRestController {
	
	@Autowired
	OilService oilService;
	
	@Autowired
	ChargeService chargeService;

	@PostMapping("/api/stations/search")
	public List<StationDTO> OilSearch(@RequestBody OilSearchDTO dto) {
		List<StationDTO> data = oilService.oilFilter(dto);
		return data;
	}
	
	@PostMapping("/api/charge/search")
	public List<ChargeDTO> ChargeSearch(@RequestBody ChargeSearchDTO dto) {
		List<ChargeDTO> data = chargeService.chargeFilter(dto);
		return data;
	}
	
	@GetMapping("/api/oil/price")
	public Map<String, Object> getOilPrice(@RequestParam String id) throws IOException {
	    String json = OilPriceAPI.getOilPrice(id);

	    ObjectMapper mapper = new ObjectMapper();
	    JsonNode root = mapper.readTree(json);

	    Map<String, Object> result = new HashMap<>();
	    result.put("id", id);

	    JsonNode oilArray = root.path("RESULT").path("OIL");
	    if (oilArray.isArray() && oilArray.size() > 0) {
	        JsonNode firstOil = oilArray.get(0);
	        JsonNode priceArray = firstOil.path("OIL_PRICE"); // ✅ 여기 변경

	        if (priceArray.isArray()) {
	            for (JsonNode item : priceArray) {
	                String prodCd = item.path("PRODCD").asText();
	                String price = item.path("PRICE").asText();

	                // ✅ PRODCD → 한글명 매핑
	                switch (prodCd) {
	                    case "B027": // 휘발유
	                        result.put("휘발유", price);
	                        break;
	                    case "D047": // 경유
	                        result.put("경유", price);
	                        break;
	                    case "C004": // LPG (API 문서에 따라 코드 다를 수 있음)
	                        result.put("등유", price);
	                        break;
	                    case "K015": // LPG (API 문서에 따라 코드 다를 수 있음)
	                        result.put("LPG", price);
	                        break;
	                    default:
	                        break;
	                }
	            }
	        }
	    }

	    System.out.println("최종 추출 결과: " + result);
	    return result;
	}


}
