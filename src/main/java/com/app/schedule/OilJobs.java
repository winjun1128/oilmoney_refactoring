package com.app.schedule;

import java.util.LinkedHashSet;
import java.util.Set;
import java.util.stream.Collectors;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import com.app.service.route.GasStationService;
import com.app.service.route.OilAvgService;

import lombok.extern.slf4j.Slf4j;

import com.app.Repository.impl.OilAvgPrice;
import com.app.dao.route.gas.GasStationDAO;
import com.app.dto.route.GasStation;

@Component
@Slf4j
public class OilJobs {
	@Autowired
	GasStationService gasStationService;
	
	@Autowired
	GasStationDAO gasStationDAO;
	
	@Autowired
	OilAvgService oilAvgService;
	
	private static final String SIDO = "05"; // 충남
	
	@Scheduled(cron = "0 49 18 * * *")
	 public void refreshOilPrices() throws Exception {
		int n = gasStationService.refreshAllOilPrices();
		System.out.println("[OIL] snapshot upsert rows = " + n);
	}
	
	/** 매일 02:10 (원하는 주기로 변경) */
	  @Scheduled(cron = "0 19 19 * * *")
	  public void refreshChungnamAverages() {
	    try {
	      var list = gasStationDAO.selectAll(SIDO, "");
	      Set<String> siguns = list.stream()
	          .map(GasStation::getSigunCd)
	          .filter(s -> s != null && !s.isBlank())
	          .collect(Collectors.toCollection(LinkedHashSet::new));

	      int ok = 0, fail = 0;
	      for (String sigun : siguns) {
	        try {
	          String body = OilAvgPrice.getAvgSigunPrice(SIDO, sigun, null, true);
	          oilAvgService.upsertOneSigun(SIDO, sigun, body);
	          ok++;
	        } catch (Exception e) {
	          log.warn("[OIL-AVG] refresh fail: sigun={}", sigun, e);
	          fail++;
	        }
	        try { Thread.sleep(80L); } catch (InterruptedException ignored) {}
	      }
	      log.info("[OIL-AVG] refreshed ok={}, fail={}, siguns={}", ok, fail, siguns.size());
	    } catch (Exception e) {
	      log.error("[OIL-AVG] scheduler fatal", e);
	    }
	  }
}
