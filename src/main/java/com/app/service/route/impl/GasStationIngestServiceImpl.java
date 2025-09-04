package com.app.service.route.impl;

import java.util.List;
import java.util.stream.Collectors;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.app.dao.route.gas.GasStationDAO;
import com.app.dto.route.GasStation;
import com.app.dto.route.OpinetEnvelope;
import com.app.service.route.GasStationIngestService;
import com.fasterxml.jackson.databind.ObjectMapper;

@Service
public class GasStationIngestServiceImpl implements GasStationIngestService {
	
	@Autowired
	GasStationDAO gasStationDAO;

	 @Transactional
	  public int ingestJson(String json) throws Exception {
	    OpinetEnvelope env = new ObjectMapper().readValue(json, OpinetEnvelope.class);
	    if (env == null || env.response == null || env.response.body == null) return 0;

	    List<GasStation> list = env.response.body.items.stream()
	        .map(com.app.mapper.GasStationMapperUtil::toEntity)
	        .collect(Collectors.toList());

	    // 대량 저장
	    return gasStationDAO.mergeList(list);
	  }

}
