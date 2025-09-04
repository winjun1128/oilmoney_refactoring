package com.app.dto.route;

import lombok.Data;

@Data
public class FavReq {
	  public String key;    // 프론트에서 오는 fav_key
	  public String mode;   // 'oil' | 'ev'
	  public String label;  // (옵션) 받아도 DB엔 저장 안 함
	  public Double lat;    // (옵션)
	  public Double lng;    // (옵션)
}
