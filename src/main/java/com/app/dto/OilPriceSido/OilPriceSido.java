package com.app.dto.OilPriceSido;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.Data;

@Data
public class OilPriceSido {

		@JsonProperty("SIDOCD")
	    private String localCode;
	    
	    @JsonProperty("SIDONM")
	    private String localName;
	    
	    @JsonProperty("PRODCD")
	    private String productName;
	    
	    @JsonProperty("PRICE")
	    private String price;
	    
	    @JsonProperty("DIFF")
	    private double diff;
	
}
