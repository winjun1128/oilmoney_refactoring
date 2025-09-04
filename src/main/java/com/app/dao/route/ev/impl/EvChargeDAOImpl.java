package com.app.dao.route.ev.impl;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

import org.mybatis.spring.SqlSessionTemplate;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Repository;

import com.app.dao.route.ev.EvChargeDAO;
import com.app.dto.route.Charger;
import com.app.dto.route.ChargerStatus;
import com.app.dto.route.ChargerType;
import com.app.dto.route.EvCharge;

import io.jsonwebtoken.lang.Collections;

@Repository
public class EvChargeDAOImpl implements EvChargeDAO {
	
	@Autowired
	SqlSessionTemplate sqlSessionTemplate;
	
	private static final int CHUNK = 500;

	@Override
	public List<EvCharge> selectEvInfo(String zcode, String nameLike) {
		Map<String,Object> p = new HashMap<>();
	    p.put("zcode", zcode);
	    p.put("nameLike", nameLike);
	    return sqlSessionTemplate.selectList("evCharge_mapper.selectEvInfo", p);
	}

	@Override
	public List<String> selectAllStatIds() {
		return sqlSessionTemplate.selectList("evCharge_mapper.selectAllStatIds");
	}

	// 스냅샷 UPSERT
	  public void mergeEvChargeBatch(List<EvCharge> list) {
	    int i = 0;
	    for (EvCharge v : list) {
	      sqlSessionTemplate.insert("evCharge_mapper.mergeEvCharge", v);
	      if (++i % CHUNK == 0) sqlSessionTemplate.flushStatements();
	    }
	    sqlSessionTemplate.flushStatements();
	  }

	  // 타입 마스터 UPSERT
	  public void mergeChargerTypeBatch(List<ChargerType> list) {
	    int i = 0;
	    for (ChargerType v : list) {
	      sqlSessionTemplate.insert("evCharge_mapper.mergeChargerType", v);
	      if (++i % CHUNK == 0) sqlSessionTemplate.flushStatements();
	    }
	    sqlSessionTemplate.flushStatements();
	  }

	  // 충전기(정적 정보) UPSERT
	  public void mergeChargerBatch(List<Charger> list) {
	    int i = 0;
	    for (Charger v : list) {
	      sqlSessionTemplate.insert("evCharge_mapper.mergeCharger", v);
	      if (++i % CHUNK == 0) sqlSessionTemplate.flushStatements();
	    }
	    sqlSessionTemplate.flushStatements();
	  }

	  // 상태 UPSERT(증분)
	  public void mergeStatusBatch(List<ChargerStatus> list) {
	    int i = 0;
	    for (ChargerStatus v : list) {
	      sqlSessionTemplate.insert("evCharge_mapper.mergeStatus", v);
	      if (++i % CHUNK == 0) sqlSessionTemplate.flushStatements();
	    }
	    sqlSessionTemplate.flushStatements();
	  }

	@Override
	public List<Map<String, Object>> selectChargerStatusByStatIds(List<String> statIds) {
		if (statIds == null || statIds.isEmpty()) return Collections.emptyList();
	    // Oracle ORA-01795(1000개 한계) 회피: 1000개 초과면 쪼개서 합치기
	    List<Map<String,Object>> out = new ArrayList<>();
	    for (int i=0; i<statIds.size(); i+=1000) {
	      Map<String,Object> param = new HashMap<>();
	      param.put("statIds", statIds.subList(i, Math.min(i+1000, statIds.size())));
	      out.addAll(sqlSessionTemplate.selectList("evCharge_mapper.selectChargerStatusByStatIds", param));
	    }
	    return out;
	}

	@Override
	  public List<Map<String, Object>> selectChargersByStatIds(List<String> statIds) {
	    if (statIds == null || statIds.isEmpty()) return Collections.emptyList();
	    List<Map<String,Object>> out = new ArrayList<>();
	    for (int i=0; i<statIds.size(); i+=1000) {
	      Map<String,Object> param = new HashMap<>();
	      param.put("statIds", statIds.subList(i, Math.min(i+1000, statIds.size())));
	      out.addAll(sqlSessionTemplate.selectList("evCharge_mapper.selectChargersByStatIds", param));
	    }
	    return out;
	  }

	@Override
	  public List<String> selectAvailableStatIds(String zcode, String type, Integer minKw) {
	    Map<String,Object> p = new HashMap<>();
	    p.put("zcode", (zcode == null || zcode.isBlank()) ? null : zcode.trim());
	    p.put("type",  (type == null  || type.isBlank())  ? "any" : type.trim().toLowerCase());
	    p.put("minKw", minKw);
	    return sqlSessionTemplate.selectList("evCharge_mapper.selectAvailableStatIds", p);
	  }
}
