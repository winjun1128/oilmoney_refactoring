package com.app.dao.route.route.impl;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

import org.mybatis.spring.SqlSessionTemplate;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Repository;

import com.app.dao.route.route.RouteDAO;
import com.app.dto.route.Route;

@Repository
public class RouteDAOImpl implements RouteDAO {
	
	@Autowired
	SqlSessionTemplate sqlSessionTemplate;

	@Override
	public List<Route> findByUserId(String userId) {
		return sqlSessionTemplate.selectList("route_mapper.selectByUserId",userId);
	}

	@Override
	public Route findByLabels(String userId, String originLabel, String destLabel) {
		Map<String,Object> p = new HashMap<>();
	    p.put("userId", userId);
	    p.put("originLabel", originLabel);
	    p.put("destLabel", destLabel); // null 허용
		return sqlSessionTemplate.selectOne("route_mapper.selectByLabels",p);
	}

	@Override
	public int insert(Route route) {
		return sqlSessionTemplate.insert("route_mapper.insert",route);
	}

	@Override
	public int deleteByIdAndUserId(Long routeId, String userId) {
		Map<String,Object> p = Map.of("routeId", routeId, "userId", userId);
		return sqlSessionTemplate.delete("route_mapper.deleteByIdAndUserId",p);
	}

	@Override
	public int deleteByLabels(String userId, String originLabel, String destLabel) {
		Map<String,Object> p = new HashMap<>();
	    p.put("userId", userId);
	    p.put("originLabel", originLabel);
	    p.put("destLabel", destLabel);
		return sqlSessionTemplate.delete("route_mapper.deleteByLabels",p);
	}

	@Override
	public Long findIdByLabels(String userId, String originLabel, String destLabel) {
		 Map<String, Object> p = new HashMap<>();
	        p.put("userId", userId);
	        p.put("originLabel", originLabel);
	        p.put("destLabel", destLabel); // null 또는 공백 → 서비스에서 정규화됨
		return sqlSessionTemplate.selectOne("route_mapper.findIdByLabels",p);
	}

}
