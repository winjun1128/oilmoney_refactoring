// src/main/java/com/app/dto/route/GasStationRow.java
package com.app.dto.route;

import lombok.Data;
import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data
public class GasStationRow {
  private String uniCd;
  private String brand;
  private String brandGroup;
  private String name;
  private String tel;

  private String addr;
  private String addrOld;
  private String sidoCd;
  private String sigunCd;

  private String selfYn;     // 'Y' / 'N'
  private String cvsYn;
  private String carWashYn;
  private String maintYn;
  private String kpetroYn;   // nullable
  private String lpgYn;      // nullable
  private String open24hYn;

  // 좌표 (NUMBER(12,1) → BigDecimal 권장 / Double도 가능)
  private BigDecimal xKatec;
  private BigDecimal yKatec;
  private BigDecimal xWeb;   // NUMBER(15,6)
  private BigDecimal yWeb;
  private Double lon;        // NUMBER(10,7) → Double
  private Double lat;

  // 가격
  private Integer priceGasoline;
  private Integer priceDiesel;
  private Integer pricePremium;
  private Integer priceKerosene;
  private Integer priceLpg;
  private LocalDateTime priceUpdatedAt;

  private LocalDateTime modifiedYmd;
  private LocalDateTime createdAt;
  private LocalDateTime updatedAt;
}
