// src/main/java/com/app/dto/EvChargeDto.java
package com.app.dto.route;

import lombok.Data;

@Data
public class EvCharge {
  private String statId;     // STATID
  private String statNm;     // STATNM
  private String addr;       // ADDR
  private String lat;        // LAT  (테이블이 VARCHAR2면 그대로 문자열로 둬도 됨; 프론트에서 숫자로 파싱)
  private String lng;        // LNG
  // 필요시 추가 필드
  private String useTime;    // USETIME
  private String zcode;      // ZCODE
  private String scode;
  private String floorNum;   // FLOORNUM
  private String floorType;  // FLOORTYPE
  private String busId;      // BUSID
  private String busiNm;     // BUSINM
  private String busiCall;   // BUSICALL
  private String updatedAt;  // UPDATED_AT
}
