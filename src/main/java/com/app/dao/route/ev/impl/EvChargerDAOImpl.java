package com.app.dao.route.ev.impl;

import java.util.List;

import org.mybatis.spring.SqlSessionTemplate;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Repository;

import com.app.dao.route.ev.EvChargerDAO;
import com.app.dto.route.Charger;
import com.app.dto.route.ChargerStatus;
import com.app.dto.route.ChargerType;
import com.app.dto.route.EvCharge;

@Repository
public class EvChargerDAOImpl implements EvChargerDAO {
	
	private static final int CHUNK = 500;
	
	@Autowired
	SqlSessionTemplate sqlSessionTemplate;

	@Override
	public List<String> selectAllStatIds() {
		return sqlSessionTemplate.selectList("evCharge_mapper.selectAllStatIds");
	}

	@Override
	public void mergeEvChargeBatch(List<EvCharge> list) {
		int i = 0;
	    for (EvCharge v : list) {
	      sqlSessionTemplate.insert("evCharge_mapper.mergeEvCharge", v);
	      if (++i % CHUNK == 0) sqlSessionTemplate.flushStatements();
	    }
	    sqlSessionTemplate.flushStatements();
		
	}

	@Override
	public void mergeChargerTypeBatch(List<ChargerType> list) {
		int i = 0;
	    for (ChargerType v : list) {
	      sqlSessionTemplate.insert("evCharge_mapper.mergeChargerType", v);
	      if (++i % CHUNK == 0) sqlSessionTemplate.flushStatements();
	    }
	    sqlSessionTemplate.flushStatements();	
	}

	@Override
	public void mergeChargerBatch(List<Charger> list) {
		int i = 0;
	    for (Charger v : list) {
	      sqlSessionTemplate.insert("evCharge_mapper.mergeCharger", v);
	      if (++i % CHUNK == 0) sqlSessionTemplate.flushStatements();
	    }
	    sqlSessionTemplate.flushStatements();
	}

	@Override
	public void mergeStatusBatch(List<ChargerStatus> list) {
		int i = 0;
	    for (ChargerStatus v : list) {
	      sqlSessionTemplate.insert("evCharge_mapper.mergeStatus", v);
	      if (++i % CHUNK == 0) sqlSessionTemplate.flushStatements();
	    }
	    sqlSessionTemplate.flushStatements();	
	}

	@Override
	public List<String> selectAllChargerKeys() {
		return sqlSessionTemplate.selectList("evCharge_mapper.selectAllChargerKeys");
	}
}
