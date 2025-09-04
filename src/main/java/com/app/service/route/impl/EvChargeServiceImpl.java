package com.app.service.route.impl;

import java.util.List;
import java.util.Map;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.app.dao.route.ev.EvChargeDAO;
import com.app.dto.route.Charger;
import com.app.dto.route.EvCharge;
import com.app.service.route.EvChargeService;

@Service
public class EvChargeServiceImpl implements EvChargeService {
	
	@Autowired
	EvChargeDAO evChargeDAO;

	@Override
	public List<EvCharge> findEvInfo(String zcode, String nameLike) {
		return evChargeDAO.selectEvInfo(zcode, nameLike);
	}

	@Override
	public List<String> selectAllStatIds() {
		return evChargeDAO.selectAllStatIds();
	}

	@Override
	  @Transactional
	  public void mergeChargerBatch(List<Charger> list) {
	      evChargeDAO.mergeChargerBatch(list); // MyBatis mapper의 <insert id="mergeCharger"> 호출
	  }

	@Override
	public List<Map<String, Object>> findChargerStatusByStatIds(List<String> statIds) {
		try {
		      return evChargeDAO.selectChargerStatusByStatIds(statIds); // 상태 테이블 조인 쿼리
	    } catch (Exception e) {
	      // 상태 테이블이 없거나 에러면 기본정보로 폴백
	      return evChargeDAO.selectChargersByStatIds(statIds);
	    }
	}

	@Override
	public List<String> selectAvailableStatIds(String zcode, String type, Integer minKw) {
		return evChargeDAO.selectAvailableStatIds(zcode, type, minKw);
	}


	
}
