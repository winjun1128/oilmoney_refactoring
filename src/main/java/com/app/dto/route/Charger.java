package com.app.dto.route;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor        // ← 기본 생성자
@AllArgsConstructor       // ← 전체 필드 생성자(필요하면)
public class Charger {
  private String statId;
  private String chgerId;
  private String typeCd;      // FK → T_CHARGER_TYPE
  private String method;      // '단독'|'동시'
  private Double outputKw;    // 3/7/50/100/200 중 하나(스냅)
}
