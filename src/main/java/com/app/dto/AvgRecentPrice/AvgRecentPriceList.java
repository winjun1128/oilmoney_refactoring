package com.app.dto.AvgRecentPrice;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.Data;
import java.util.List;

@Data
public class AvgRecentPriceList {

	@JsonProperty("OIL")
    private List<AvgRecentPrice> oilList;
	
}
