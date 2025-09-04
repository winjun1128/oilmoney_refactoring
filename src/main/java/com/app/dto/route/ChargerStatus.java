package com.app.dto.route;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor        // ← 기본 생성자
@AllArgsConstructor       // ← 전체 필드 생성자(필요하면)
public class ChargerStatus {
	  private String statId;
	  private String chgerId;
	  private String stat;       // 1/2/3/5/9...
	  private String statUpdDt;  // yyyymmddhh24miss
	  private String lastTsdt;
	  private String lastTedt;
	  private String nowTsdt;
}
