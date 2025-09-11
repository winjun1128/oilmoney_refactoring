package com.app.service;

import java.util.Collections;
import java.util.List;

import lombok.extern.slf4j.Slf4j;

import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import com.app.dto.LowerTop.LowerTopPrice;
import com.app.dto.LowerTop.LowerTopPriceResult;
import com.fasterxml.jackson.databind.ObjectMapper;

@Slf4j
@Service
public class LowerTopService {

	private final String API_KEY = "F250822740";
	//private final String API_KEY = "F250904769";
	//private final String API_KEY = "F250909785";
	
	// 선택된 시군(area) 코드로 최저가 주유소 가져오기
	public List<LowerTopPrice> getAndProcessOilPrices(String area, String prodcd) {
		
		// ✅ 널(null) 또는 빈 문자열(empty) 체크 추가
        if (area == null || area.isEmpty() || prodcd == null || prodcd.isEmpty()) {
            log.warn("유효하지 않은 지역 또는 유종 코드로 요청이 들어왔습니다. area={}, prodcd={}", area, prodcd);
            return Collections.emptyList();
        }
        
		String apiUrl = "https://www.opinet.co.kr/api/lowTop10.do?out=json"
				+ "&prodcd=" + prodcd 
				+ "&area=" + area
				+ "&cnt=7"
				+ "&code=" + API_KEY;
		
		RestTemplate restTemplate = new RestTemplate();
		ObjectMapper mapper = new ObjectMapper();
		
		try {
			HttpHeaders headers = new HttpHeaders();
			headers.set("User-Agent", "Mozilla/5.0");
			HttpEntity<String> entity = new HttpEntity<>("parameters", headers);

			ResponseEntity<String> response = restTemplate.exchange(
					apiUrl,
					HttpMethod.GET,
					entity,
					String.class
			);
			
			if (response.getStatusCode().is2xxSuccessful() && response.getBody() != null) {
				String json = response.getBody();
				
				log.info("=== API 응답 === {}", json);
				
				LowerTopPriceResult result = mapper.readValue(json, LowerTopPriceResult.class);
				System.out.println(result);
				return result.getResult().getOilList();
			}
		} catch (Exception e) {
			log.error("유가 정보 처리 중 오류 발생", prodcd, e);
		}
		return Collections.emptyList();
	}
}
