package com.app.service.route;

import java.util.List;
import java.util.Map;

import com.app.dto.route.Charger;
import com.app.dto.route.EvCharge;

public interface EvChargeService {
	List<EvCharge> findEvInfo(String zcode, String nameLike);
	List<String> selectAllStatIds();
	
	void mergeChargerBatch(List<Charger> list);
	
	List<Map<String,Object>> findChargerStatusByStatIds(List<String> statIds);
	
	List<String> selectAvailableStatIds(String zcode, String type, Integer minKw);
}
