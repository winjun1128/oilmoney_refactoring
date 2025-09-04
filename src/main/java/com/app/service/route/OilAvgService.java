package com.app.service.route;

import java.util.Map;
import java.util.Set;

public interface OilAvgService {
	public Map<String,Integer> parseAvgPerProd(String body);
	public Map<String, Map<String,Integer>> findAvgBySiguns(String sidoCd, Set<String> siguns);
	public void upsertOneSigun(String sidoCd, String sigunCd, String rawJson);
}
