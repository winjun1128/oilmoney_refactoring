package com.app.dao.charge.impl;

import java.util.List;
import java.util.Map;

import org.mybatis.spring.SqlSessionTemplate;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Repository;

import com.app.dao.charge.ChargeDAO;
import com.app.dto.ChargeDTO;
import com.app.dto.ChargeSearchDTO;
import com.app.dto.StationDTO;

@Repository
public class ChargeDAOImpl implements ChargeDAO {

	@Autowired
	SqlSessionTemplate sqlSessionTemplate;

	@Override
	public int saveChargeInfoList(List<ChargeDTO> data) {
		int total = sqlSessionTemplate.insert("charge_mapper.saveChargeInfoList", data);

		return total;
	}

	@Override
	public int saveChargeInfo(ChargeDTO data) {

		return sqlSessionTemplate.insert("charge_mapper.saveChargeInfo", data);
	}

	@Override
	public List<ChargeDTO> findCharger(ChargeSearchDTO dto) {
		List<ChargeDTO> data = sqlSessionTemplate.selectList("charge_mapper.findCharger", dto);
		return data;
	}

	@Override
	public List<ChargeDTO> chargeFilter(ChargeSearchDTO dto) {
		List<ChargeDTO> data = sqlSessionTemplate.selectList("charge_mapper.chargeFilter", dto);
		return data;
	}

	@Override
	public List<ChargeDTO> findChargeNearby(Map<String, Object> param) {
		return sqlSessionTemplate.selectList("charge_mapper.findChargeNearby", param);

	}
}
