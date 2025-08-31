// GasStationMapperUtil.java
package com.app.mapper;

import java.math.BigDecimal;

import com.app.dto.route.GasStation;
import com.app.dto.route.OpinetEnvelope;

public final class GasStationMapperUtil {
  private GasStationMapperUtil(){}

  private static BigDecimal dec(String s) {
    if (s == null || s.isBlank()) return null;
    try { return new BigDecimal(s.trim()); } catch (Exception e) { return null; }
  }
  private static String yn(String s) {
    if (s == null) return "N";
    s = s.trim().toUpperCase();
    return ("Y".equals(s) || "N".equals(s)) ? s : "N";
  }
  private static String ttn(String s) { // trim-to-null
    if (s == null) return null;
    s = s.trim();
    return s.isEmpty() ? null : s;
  }

  public static GasStation toEntity(OpinetEnvelope.Station s) {
    return GasStation.builder()
        .uniCd(s.uniCd)
        .brand(ttn(s.brand))
        .brandGroup(ttn(s.brandGroup))
        .name(s.name)
        .tel(ttn(s.tel))
        .addr(s.addr)
        .addrOld(ttn(s.addrOld))
        .sidoCd(s.sidoCd)
        .sigunCd(s.sigunCd)
        .selfYn(yn(s.selfYn))
        .cvsYn(yn(s.cvsYn))
        .carWashYn(yn(s.carWashYn))
        .maintYn(yn(s.maintYn))
        .kpetroYn(ttn(s.kpetroYn))
        .lpgYn(yn(s.lpgYn))
        .open24hYn("N")
        .xKatec(dec(s.xKatec))
        .yKatec(dec(s.yKatec))
        .xWeb(dec(s.xWeb))
        .yWeb(dec(s.yWeb))
        .modifiedYmd(ttn(s.modifiedYmd)) // SQL에서 TO_DATE 처리
        .build();
  }
}
