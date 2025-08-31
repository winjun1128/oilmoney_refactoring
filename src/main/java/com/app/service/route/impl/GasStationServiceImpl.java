package com.app.service.route.impl;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import com.app.dao.route.gas.GasStationDAO;
import com.app.dto.route.GasStation;
import com.app.service.route.GasStationService;

@Service
public class GasStationServiceImpl implements GasStationService {
	@Autowired
	GasStationDAO gasStationDAO;
	
	public Map<String,Object> getAllFromDb(String sidoCd, String sigunCd) {
	    List<GasStation> items = gasStationDAO.selectAll(sidoCd, sigunCd);
	    int total = items.size();

	    Map<String,Object> header = new HashMap<>();
	    header.put("resultCode", "00");
	    header.put("resultMsg",  "DB SUCCESS");

	    Map<String,Object> body = new HashMap<>();
	    body.put("pageNo", 1);
	    body.put("numOfRows", total);
	    body.put("totalCount", total);
	    body.put("items", items);

	    Map<String,Object> response = new HashMap<>();
	    response.put("header", header);
	    response.put("body", body);

	    Map<String,Object> outer = new HashMap<>();
	    outer.put("response", response);
	    return outer;
	  }

	@Override
	public List<String> selectAllUniCd() {
		
		return gasStationDAO.selectAllUniCd();
	}
}
