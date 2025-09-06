package com.app.dto.SiGun;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.Data;

@Data
public class SiGunCode {

	@JsonProperty("AREA_CD") //시도 코드
	private String area_cd;	
	
	@JsonProperty("AREA_NM") //시도 이름
	private String area_nm;
	
}
