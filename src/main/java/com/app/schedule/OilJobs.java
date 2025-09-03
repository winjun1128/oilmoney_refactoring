package com.app.schedule;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import com.app.service.route.GasStationService;

@Component
public class OilJobs {
	@Autowired
	GasStationService gasStationService;
	@Scheduled(cron = "0 41 12 * * *")
	 public void refreshOilPrices() throws Exception {
		int n = gasStationService.refreshAllOilPrices();
		System.out.println("[OIL] snapshot upsert rows = " + n);
	}
}
