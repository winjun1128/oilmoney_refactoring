package com.app.dto.route;

import lombok.Data;

@Data
public class Fav {
	  private Long id;
	  private String userId;
	  private String favKey;
	  private String type;   // 'oil' | 'ev'
}
