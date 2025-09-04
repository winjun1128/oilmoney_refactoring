package com.app.dao.route.gas.impl;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

import org.mybatis.spring.SqlSessionTemplate;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Repository;

import com.app.dao.route.gas.OilAvgDAO;
import com.app.dto.route.OilAvgPriceRow;

//com/app/dao/route/gas/impl/OilAvgDAOImpl.java
@Repository
public class OilAvgDAOImpl implements OilAvgDAO {

	@Autowired
	SqlSessionTemplate sqlSessionTemplate;

	@Override
	public int mergeOne(OilAvgPriceRow row) {
		// DTO를 그대로 전달
		return sqlSessionTemplate.update("oilAvgPrice_mapper.mergeOne", row);
	}

	@Override
	public void mergeBatch(List<OilAvgPriceRow> rows) {
		if (rows == null || rows.isEmpty())
			return;
		for (OilAvgPriceRow r : rows) {
			sqlSessionTemplate.update("oilAvgPrice_mapper.mergeOne", r);
		}
	}

	@Override
	public List<OilAvgPriceRow> selectBySiguns(String sidoCd, List<String> siguns) {
		Map<String, Object> p = new HashMap<>();
		p.put("sidoCd", sidoCd);
		p.put("siguns", siguns);
		return sqlSessionTemplate.selectList("oilAvgPrice_mapper.selectBySiguns", p);
	}
}
