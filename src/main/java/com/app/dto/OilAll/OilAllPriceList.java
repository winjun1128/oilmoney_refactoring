package com.app.dto.OilAll;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.Data;
import java.util.List;

@Data
public class OilAllPriceList {
	
    @JsonProperty("OIL")
    private List<OilAllPrice> oilList;
    //전국 주유소 평균가격의 필드변수들을 리스트로 만듬
}