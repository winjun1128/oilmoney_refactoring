package com.app.dto.OilPriceSido;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.Data;
import java.util.List;

@Data
public class OilPriceSidoList {
    @JsonProperty("OIL")
    private List<OilPriceSido> oilList;
}