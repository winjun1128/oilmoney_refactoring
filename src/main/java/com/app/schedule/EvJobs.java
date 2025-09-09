package com.app.schedule;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import com.app.service.route.EvImportService;


@Component
public class EvJobs {
	
  @Autowired
  EvImportService evImportService;

  // 앱 시작 시 1회 전체 스냅샷
  @Scheduled(cron = "0 0 19 * * *")
  public void init() throws Exception {
    evImportService.importInfoSnapshot();
  }

  // 상태 폴링: 1시간마다 / 최근 5분 증분
  @Scheduled(cron = "0 0 * * * *")
  public void pollStatus() throws Exception {
      int n = evImportService.pollStatusIncrement(5);
      System.out.println("[EV] status upsert rows = " + n);
  }

  // 정보 스냅샷 리프레시: 매일 04:00
//  @Scheduled(cron = "0 0 4 * * *")
//  public void refreshInfo() throws Exception {
//    evImportService.importInfoSnapshot();
//  }
  
  
}
