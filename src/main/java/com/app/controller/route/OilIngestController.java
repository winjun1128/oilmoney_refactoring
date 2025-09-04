// OilIngestController.java
package com.app.controller.route;

import com.app.Repository.impl.OilInfo;
import com.app.service.route.impl.GasStationIngestServiceImpl;

import lombok.RequiredArgsConstructor;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.*;

@Controller
@RequestMapping("/api/oil")
public class OilIngestController {

	@Autowired
	GasStationIngestServiceImpl gasStationIngestServiceImpl;


  @PostMapping(value="/ingest", consumes = MediaType.APPLICATION_JSON_VALUE)
  public String ingestFromBody(@RequestBody String json) throws Exception {
    int n = gasStationIngestServiceImpl.ingestJson(json);
    return "OK: " + n;
  }

  // 외부 API를 내부에서 호출해 저장하고 싶다면:
   @GetMapping("/ingest/live")
   public String ingestLive() throws Exception {
     String json = OilInfo.getOilInfo(); // 기존 구현 사용
     int n = gasStationIngestServiceImpl.ingestJson(json);
     return "OK: " + n;
   }
}
