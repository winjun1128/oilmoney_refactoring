package com.app.service;

import com.app.dto.OilAll.OilAllPrice;
import com.app.dto.OilAll.OilAllPriceResult;
import com.fasterxml.jackson.databind.ObjectMapper;

import lombok.extern.slf4j.Slf4j;

import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.web.client.RestTemplate;

import java.util.Collections;
import java.util.List;

@Slf4j
@Service
public class OilAllPriceService {

	@Value("${opinet.api.key}")
	private String API_KEY;

    public List<OilAllPrice> getAndProcessOilPrices() {
        String apiUrl = "http://www.opinet.co.kr/api/avgAllPrice.do?out=json&code=" + API_KEY;
        RestTemplate restTemplate = new RestTemplate();
        ObjectMapper mapper = new ObjectMapper();
        try {
            // 브라우저 흉내내는 헤더
            HttpHeaders headers = new HttpHeaders();
            headers.set("User-Agent", "Mozilla/5.0");
            HttpEntity<String> entity = new HttpEntity<>("parameters", headers);

            // 응답을 문자열로 받음
            ResponseEntity<String> response = restTemplate.exchange(
                apiUrl,
                HttpMethod.GET,
                entity,
                String.class
            );
            // 상태코드 확인 및 응답 처리
            if (response.getStatusCode().is2xxSuccessful() && response.getBody() != null) {
                String json = response.getBody();
                log.info("=== API 응답 === {}", json);
                // 문자열(JSON)을 DTO로 변환
                OilAllPriceResult result = mapper.readValue(json, OilAllPriceResult.class);
                return result.getResult().getOilList();
            }
        } catch (Exception e) {
            log.error("유가 정보 처리 중 오류 발생", e);
            System.out.println("전국평균가 오류");
        }
        return Collections.emptyList();
    }
}