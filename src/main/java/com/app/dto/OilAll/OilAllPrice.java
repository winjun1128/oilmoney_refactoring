package com.app.dto.OilAll;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.Data;

@Data
public class OilAllPrice {

	@JsonProperty("TRADE_DT") // 날짜
	private String tradeDate;

	@JsonProperty("PRODCD")
	private String productCode;
	// 제품구분코드 B027:휘발유, D047:경유, B034:고급휘발유, C004:실내등유, K015:자동차부탄

	@JsonProperty("PRODNM") //제품명
	private String productName;

	@JsonProperty("PRICE") //평균가격
	private String price;

	@JsonProperty("DIFF") //전일대비 등락값
	private String diff;

}