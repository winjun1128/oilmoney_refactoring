package com.app.dto.SiGun;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.Data;
import java.util.List;

@Data
public class SiGunCodeList {

	@JsonProperty("OIL")
    private List<SiGunCode> oilList;
	
}
