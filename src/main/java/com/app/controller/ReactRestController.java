package com.app.controller;

import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.util.Base64;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;

import javax.servlet.http.HttpServletRequest;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
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
import com.app.util.JwtProvider;
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
		if ("nearby".equals(dto.getMode())) {
	        // 📍 내 주변 주유소 검색
	        return oilService.findNearby(dto.getLat(), dto.getLon(), dto.getRadius());
	    } else {
	        // 📍 기존 필터 기반 검색
	        return oilService.oilFilter(dto);
	    }
	}
	
	@PostMapping("/api/charge/search")
	public List<ChargeDTO> ChargeSearch(@RequestBody ChargeSearchDTO dto) {
		if ("nearby".equals(dto.getMode())) {
	        // 📍 내 주변 충전소 검색
			List<ChargeDTO> data = chargeService.findChargeNearby(dto.getLat(), dto.getLng(), dto.getRadius());
	        return chargeService.findChargeNearby(dto.getLat(), dto.getLng(), dto.getRadius());
	    } else {
	        // 📍 기존 필터 기반 검색
	        return chargeService.chargeFilter(dto);
	    }
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
	
	public class IdTokenReq {
	    public String token;
	}
	
	@GetMapping(value = "/idtoken", produces = MediaType.APPLICATION_JSON_VALUE)
	public ResponseEntity<?> idToken(
	        @RequestParam(value = "token", required = false) String token,  // ?token=abc 지원(옵션)
	        HttpServletRequest request
	) {
	    try {
	        // 1) 쿼리 파라미터가 없으면 Authorization 헤더에서 추출
	        if (token == null || token.isBlank()) {
	            token = JwtProvider.extractToken(request); // "Authorization: Bearer xxx"
	        }
	        if (token == null || token.isBlank() || !JwtProvider.isValidToken(token)) {
	            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
	                    .body(Map.of("error", "unauthorized"));
	        }

	        // 2) 토큰에서 userId 꺼내기
	        String userId = JwtProvider.getUserIdFromToken(token);
	        if (userId == null || userId.isBlank() || "accessToken".equals(userId)) {
	            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
	                    .body(Map.of("error", "no_userId"));
	        }

	        // 3) 즐겨찾기 조회 후 반환
	        List<StationDTO> list = oilService.findFavOilStations(userId);
	        return ResponseEntity.ok(list);

	    } catch (Exception e) {
	        e.printStackTrace();
	        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
	                .body(Map.of("error", "server_error", "message", e.getMessage()));
	    }
	}


}

