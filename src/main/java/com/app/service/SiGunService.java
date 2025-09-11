package com.app.service;

import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.web.client.RestTemplate;

import com.app.dto.SiGun.SigunCodeResult;
import com.fasterxml.jackson.databind.ObjectMapper;

import lombok.extern.slf4j.Slf4j;

@Slf4j
@Service
public class SiGunService {

	 @Value("${opinet.api.key}")
	    private String API_KEY;
	
    public SigunCodeResult getSigunList(String sidoCode) {
        String apiUrl = "https://www.opinet.co.kr/api/areaCode.do?out=json&code=" + API_KEY + "&area=" + sidoCode;
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
                log.info("=== 시군 API 응답 === {}", json);
                return mapper.readValue(json, SigunCodeResult.class);
            }
        } catch (Exception e) {
            log.error("시군 데이터 처리 중 오류 발생", e);
        }
        return new SigunCodeResult();
        
    }
}
