package com.app.dao.route.route;

import java.util.List;

import com.app.dto.route.Route;

public interface RouteDAO {
	List<Route> findByUserId(String userId);
	Route findByLabels(String userId, String originLabel, String destLabel); // 없으면 null
	int insert(Route route);
	int deleteByIdAndUserId(Long routeId, String userId);
	int deleteByLabels(String userId, String originLabel, String destLabel);
	
	Long findIdByLabels(String userId, String originLabel, String destLabel);
}

