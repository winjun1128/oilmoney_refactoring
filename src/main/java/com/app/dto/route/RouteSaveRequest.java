package com.app.dto.route;

import lombok.Data;

@Data
public class RouteSaveRequest {
	private String originLabel;
	  private Double originLon;
	  private Double originLat;
	  private String destLabel;   // 옵션
	  private Double destLon;     // 옵션
	  private Double destLat;     // 옵션
	  private Boolean isOriginOnly; // 옵션(프론트에서 보냈다면), 없어도 됨
}
