package com.app.service.Oil.impl;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import com.app.dao.Oil.OilDAO;
import com.app.dto.ChargeDTO;
import com.app.dto.ChargeSearchDTO;
import com.app.dto.OilSearchDTO;
import com.app.dto.StationDTO;
import com.app.service.Oil.OilService;

@Service
public class OilServiceImpl implements OilService{

	@Autowired
	OilDAO oilDAO;
	
	@Override
	public List<StationDTO> oilFilter(OilSearchDTO dto) {
		List<StationDTO> data = oilDAO.oilFilter(dto); 
		return data;
	}

	@Override
	public List<StationDTO> findNearby(Double lat, Double lon, Integer radius) {
		 Map<String, Object> param = new HashMap<>();
	        param.put("lat", lat);
	        param.put("lon", lon);
	        param.put("radius", radius);
	        return oilDAO.findNearby(param);
	}


}
