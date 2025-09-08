package com.app.service.charge.impl;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import com.app.dao.charge.ChargeDAO;
import com.app.dto.ChargeDTO;
import com.app.dto.ChargeSearchDTO;
import com.app.service.charge.ChargeService;


@Service
public class ChargeServiceImpl implements ChargeService {

	@Autowired
	ChargeDAO chargeDAO;

	@Override
	public int saveChargeInfoList(List<ChargeDTO> data) {
		int chargeList = chargeDAO.saveChargeInfoList(data);
		
		//for 
		// save
		
		return chargeList;
	}

	@Override
	public int saveChargeInfo(ChargeDTO data) {
		
		return chargeDAO.saveChargeInfo(data);
	}

	@Override
	public List<ChargeDTO> findCharger(ChargeSearchDTO dto) {
		List<ChargeDTO> data = chargeDAO.findCharger(dto);
		System.out.println(dto);
		return data;
	}

	@Override
	public List<ChargeDTO> chargeFilter(ChargeSearchDTO dto) {
		List<ChargeDTO> data = chargeDAO.chargeFilter(dto);
		return data;
	}

	@Override
	public List<ChargeDTO> findChargeNearby(Double lat, Double lng, Double radius) {
		Map<String, Object> param = new HashMap<>();
        param.put("lat", lat);
        param.put("lng", lng);
        param.put("radius", radius);
		return chargeDAO.findChargeNearby(param);
	}
}
