package com.app.dto.OilPriceSido;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.Data;

@Data
public class OilPriceSidoResult {
	
    @JsonProperty("RESULT")
    private OilPriceSidoList result;
    
}