package com.app.service;

import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import com.app.dto.SiGun.SigunCodeResult;
import com.fasterxml.jackson.databind.ObjectMapper;

import lombok.extern.slf4j.Slf4j;

@Slf4j
@Service
public class SiGunService {

	private final String API_KEY = "F250822740";
	//private final String API_KEY = "F250904769";
	
    public SigunCodeResult getSigunList(String sidoCode) {
        String apiUrl = "https://www.opinet.co.kr/api/areaCode.do?out=json&code=" + API_KEY + "&area=" + sidoCode;
        RestTemplate restTemplate = new RestTemplate();
        ObjectMapper mapper = new ObjectMapper();
        
        System.out.println("11");
        
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
            
            System.out.println("22");
            
            if (response.getStatusCode().is2xxSuccessful() && response.getBody() != null) {
                String json = response.getBody();
                System.out.println("2.53");
                log.info("=== 시군 API 응답 === {}", json);
                System.out.println("33");
                return mapper.readValue(json, SigunCodeResult.class);
            }
        } catch (Exception e) {
            log.error("시군 데이터 처리 중 오류 발생", e);
        }
        return new SigunCodeResult();
        
    }
}
