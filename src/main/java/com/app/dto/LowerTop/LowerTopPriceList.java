package com.app.dto.LowerTop;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.Data;
import java.util.List;

@Data
public class LowerTopPriceList {

	@JsonProperty("OIL")
    private List<LowerTopPrice> oilList;
	
}
