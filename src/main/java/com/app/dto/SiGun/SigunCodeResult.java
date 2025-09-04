package com.app.dto.SiGun;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.Data;

@Data
public class SigunCodeResult {

	@JsonProperty("RESULT")
    private SiGunCodeList result;
	
}
