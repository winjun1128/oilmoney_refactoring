package com.app.dto.LowerTop;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.Data;

@Data
@JsonIgnoreProperties(ignoreUnknown = true) // DTO에 없는 필드는 무시
public class LowerTopPrice {

	@JsonProperty("UNI_ID") // 주유소 코드
	private String stationId;

	@JsonProperty("PRICE") // 판매가격
	private String price;

	@JsonProperty("POLL_DIV_CD")
	private String brandCode;
	// 상표(SKE:SK에너지, GSC:GS칼텍스, HDO:현대오일뱅크, SOL:S-OIL,
	// RTE:자영알뜰, RTX:고속도로알뜰, NHO:농협알뜰, ETC:자가상표, E1G: E1, SKG:SK가스)

	@JsonProperty("OS_NM") // 상호명
	private String stationName;

	@JsonProperty("NEW_ADR") // 도로명 주소
	private String roadAddress;
	
	@JsonProperty("VAN_ADR") //지번주소
	private String vanAddress;

	@JsonProperty("GIS_X_COOR") //X좌표
	private String xCoor;

	@JsonProperty("GIS_Y_COOR")	//Y좌표
	private String yCoor;

}
