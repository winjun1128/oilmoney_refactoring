// src/main/java/com/app/service/impl/EvImportServiceImpl.java
package com.app.service.route.impl;

import java.util.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.app.api.EvOpenApiClient;
import com.app.dao.route.ev.EvChargerDAO;
import com.app.dto.route.Charger;
import com.app.dto.route.ChargerStatus;
import com.app.dto.route.ChargerType;
import com.app.dto.route.EvCharge;
import com.app.service.route.EvImportService;
import com.fasterxml.jackson.databind.JsonNode;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class EvImportServiceImpl implements EvImportService {

  @Autowired
  private EvChargerDAO evChargerDAO;

  private final EvOpenApiClient client;

  private static final int ZCODE = 44;
  private static final int ROWS  = 9999;

  private static final Map<String, String> TYPE_NAME = Map.ofEntries(
      Map.entry("01","DC차데모"),
      Map.entry("02","AC완속"),
      Map.entry("03","DC차데모+AC3상"),
      Map.entry("04","DC콤보"),
      Map.entry("05","DC차데모+DC콤보"),
      Map.entry("06","DC차데모+AC3상+DC콤보"),
      Map.entry("07","AC3상"),
      Map.entry("08","DC콤보(완속)")
  );

  // ===== helpers =====
  private static String nz(JsonNode node, String... keys) {
    if (keys == null || keys.length == 0) {
      if (node == null || node.isMissingNode() || node.isNull()) return null;
      String v = node.asText();
      return isBlankOrNullLiteral(v) ? null : v;
    }
    for (String k : keys) {
      JsonNode v = node.path(k);
      if (v != null && !v.isMissingNode() && !v.isNull()) {
        String s = v.asText();
        if (!isBlankOrNullLiteral(s)) return s;
      }
    }
    return null;
  }
  private static boolean isBlankOrNullLiteral(String s) {
    return s == null || s.isBlank() || "null".equalsIgnoreCase(s);
  }
  private static Double nzDouble(JsonNode node, String... keys) {
    String s = nz(node, keys);
    if (s == null) return null;
    try { return Double.parseDouble(s); } catch (NumberFormatException ignore) { return null; }
  }
  private static Double normalizeOutput(Double raw) {
    if (raw == null) return null;
    double[] allowed = {3, 7, 50, 100, 200};
    double best = allowed[0], diff = Math.abs(raw - allowed[0]);
    for (double a : allowed) {
      double d = Math.abs(raw - a);
      if (d < diff) { diff = d; best = a; }
    }
    return best;
  }
  private static String normalizeMethod(String method) {
    return "동시".equals(method) ? "동시" : "단독";
  }

  /** 1) 스냅샷: 충전소 + 충전기(정적) + 타입마스터 */
  @Override
  @Transactional
  public void importInfoSnapshot() throws Exception {
    List<EvCharge> stations = new ArrayList<>();
    List<Charger> chargers  = new ArrayList<>();
    Map<String, ChargerType> typeMap = new HashMap<>();
    Set<String> seenStat = new HashSet<>();

    int page = 1;
    while (true) {
      JsonNode items = client.fetchInfoPage(ZCODE, page, ROWS);
      if (!items.isArray() || items.size() == 0) break;

      for (JsonNode it : items) {
        // ---- 충전소 ----
        String statId = nz(it, "statId", "statid", "stat");
        if (statId == null) continue;

        if (seenStat.add(statId)) {
          EvCharge s = new EvCharge();
          s.setStatId(statId);
          s.setStatNm(nz(it, "statNm", "statnm", "statName"));
          s.setAddr  (nz(it, "addr", "address"));
          s.setLat   (nz(it, "lat"));
          s.setLng   (nz(it, "lng"));

          // ★ useTime은 NOT NULL 보정 (ORA-01400 예방)
          s.setUseTime(nz(it, "useTime"));


          s.setZcode (nz(it, "zcode"));
          s.setScode (nz(it, "zscode", "scode")); // ★ SCODE 매핑

       // floorNum / floorType
          s.setFloorNum(nz(it, "floorNum", "floor"));

          s.setFloorType(nz(it, "floorType", "floorTypeNm"));

          s.setBusId   (nz(it, "busiId", "busId"));
          s.setBusiNm  (nz(it, "busiNm", "busNm"));
          s.setBusiCall(nz(it, "busiCall", "busCall"));

          stations.add(s);
        }

        // ---- 충전기(포트) ----
        String chgerId = nz(it, "chgerId", "chgerid");
        if (chgerId == null) continue;

        String typeCd   = nz(it, "chgerType", "type");
        String method   = normalizeMethod(nz(it, "method"));
        Double output   = nzDouble(it, "output", "outputKw", "outputKW");
        Double outputKw = normalizeOutput(output);

        if (typeCd != null) {
          typeMap.putIfAbsent(typeCd, new ChargerType(){{
            setTypeCd(typeCd);
            setTypeNm(TYPE_NAME.getOrDefault(typeCd, "기타"));
          }});
        }

        Charger c = new Charger();
        c.setStatId(statId);
        c.setChgerId(chgerId);
        c.setTypeCd(typeCd);
        c.setMethod(method);
        c.setOutputKw(outputKw);
        chargers.add(c);
      }
      page++;
    }

    if (!stations.isEmpty()) evChargerDAO.mergeEvChargeBatch(stations);
    if (!typeMap.isEmpty())  evChargerDAO.mergeChargerTypeBatch(new ArrayList<>(typeMap.values()));
    if (!chargers.isEmpty()) evChargerDAO.mergeChargerBatch(chargers);
  }

  /** 2) 증분: 최근 period분 상태 변화만 UPSERT (DB에 존재하는 포트만 반영) */
  @Override
  @Transactional
  public int pollStatusIncrement(int periodMinutes) throws Exception {
    // DB에 존재하는 포트키( STATID|CHGERID ) 목록
    Set<String> existing = new HashSet<>(evChargerDAO.selectAllChargerKeys());

    List<ChargerStatus> list = new ArrayList<>();
    int page = 1, total = 0;

    while (true) {
      JsonNode items = client.fetchStatusPage(ZCODE, periodMinutes, page, ROWS);
      if (!items.isArray() || items.size() == 0) break;

      for (JsonNode it : items) {
        String statId  = nz(it, "statId");
        String chgerId = nz(it, "chgerId");
        if (statId == null || chgerId == null) continue;

        // 부모 포트가 있을 때만 수집 (FK 위반 방지)
        if (!existing.contains(statId + "|" + chgerId)) continue;

        ChargerStatus s = new ChargerStatus();
        s.setStatId(statId);
        s.setChgerId(chgerId);
        s.setStat(nz(it, "stat"));
        s.setStatUpdDt(nz(it, "statUpdDt"));
        s.setLastTsdt(nz(it, "lastTsdt"));
        s.setLastTedt(nz(it, "lastTedt"));
        s.setNowTsdt(nz(it, "nowTsdt"));

        list.add(s);
        total++;
      }
      page++;
    }

    if (!list.isEmpty()) evChargerDAO.mergeStatusBatch(list);
    return total;
  }
}
