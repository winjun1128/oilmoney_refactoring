// GasStation.java
package com.app.dto.route;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

import com.fasterxml.jackson.annotation.JsonFormat;

import lombok.*;

@Data
@Builder
public class GasStation {
  // key
  private String uniCd;

  // basic
  private String brand;
  private String brandGroup;
  private String name;
  private String tel;
  private String addr;
  private String addrOld;
  private String sidoCd;
  private String sigunCd;

  // flags
  private String selfYn;     // 'Y'/'N'
  private String cvsYn;
  private String carWashYn;
  private String maintYn;
  private String kpetroYn;
  private String lpgYn;
  private String open24hYn;

  // coords
  private BigDecimal xKatec; // GIS_X_COOR
  private BigDecimal yKatec; // GIS_Y_COOR
  private BigDecimal xWeb;   // X
  private BigDecimal yWeb;   // Y
  private BigDecimal lon;    // WGS84 경도(선택)
  private BigDecimal lat;    // WGS84 위도(선택)

  // prices
  private Integer priceGasoline;
  private Integer priceDiesel;
  private Integer pricePremium;
  private Integer priceKerosene;
  private Integer priceLpg;
  private LocalDateTime priceUpdatedAt;

  // meta
  private String modifiedYmd;         // MOFY_DT → YYYYMMDD
  @JsonFormat(pattern = "yyyy-MM-dd'T'HH:mm:ss")
  private LocalDateTime createdAt;
  @JsonFormat(pattern = "yyyy-MM-dd'T'HH:mm:ss")
  private LocalDateTime updatedAt;
}
