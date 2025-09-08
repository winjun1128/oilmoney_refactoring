package com.app.dto.route;

import lombok.Data;

//com.example.route.model.Route

@Data
public class Route {
	private Long routeId;
	private String userId;
	private String originLabel;
	private Double originLon;
	private Double originLat;
	private String destLabel;   // null 가능
	private Double destLon;     // null 가능
	private Double destLat;     // null 가능
	private java.time.OffsetDateTime createdAt;
	private java.time.OffsetDateTime updatedAt;
// getters/setters
}



