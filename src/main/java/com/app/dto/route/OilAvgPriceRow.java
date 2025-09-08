package com.app.dto.route;

import java.time.LocalDateTime;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class OilAvgPriceRow {
  private String sidoCd;    // "05"
  private String sigunCd;   // "0506"
  private String prodcd;    // "B027"
  private Integer price;    // 원/L
  private LocalDateTime updatedAt;
}
