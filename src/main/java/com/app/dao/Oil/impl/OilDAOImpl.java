package com.app.dao.Oil.impl;

import java.util.List;
import java.util.Map;

import org.mybatis.spring.SqlSessionTemplate;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Repository;

import com.app.dao.Oil.OilDAO;
import com.app.dto.ChargeDTO;
import com.app.dto.ChargeSearchDTO;
import com.app.dto.OilSearchDTO;
import com.app.dto.StationDTO;

@Repository
public class OilDAOImpl implements OilDAO{
	
	@Autowired
	SqlSessionTemplate sqlSessionTemplate;

	@Override
	public List<StationDTO> oilFilter(OilSearchDTO dto) {
		List<StationDTO> data = sqlSessionTemplate.selectList("station_mapper.oilFilter",dto);
		return data;
	}

	@Override
	public List<StationDTO> findNearby(Map<String, Object> param) {
		return sqlSessionTemplate.selectList("station_mapper.findNearby", param);
	}

}
