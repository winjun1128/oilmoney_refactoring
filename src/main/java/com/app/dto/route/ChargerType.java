package com.app.dto.route;

import lombok.Data;

@Data
public class ChargerType {
	  private String typeCd;  // '01'..'09'
	  private String typeNm;  // DC콤보, AC완속...
}
