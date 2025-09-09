package com.app.service.route;

import java.util.List;

import com.app.dto.route.Route;
import com.app.dto.route.RouteSaveRequest;

public interface RouteService {
	 List<Route> list(String string);
	  Long save(String uid, RouteSaveRequest req);               // upsert-ish
	  int delete(String uid, Long routeId);
	  int deleteByLabels(String uid, String originLabel, String destLabel);
}
