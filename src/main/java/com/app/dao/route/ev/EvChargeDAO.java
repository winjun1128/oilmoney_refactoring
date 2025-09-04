package com.app.dao.route.ev;

import java.util.List;
import java.util.Map;

import com.app.dto.route.Charger;
import com.app.dto.route.ChargerStatus;
import com.app.dto.route.ChargerType;
import com.app.dto.route.EvCharge;

public interface EvChargeDAO {
	List<EvCharge> selectEvInfo(String zcode, String nameLike);
	List<String> selectAllStatIds();
	void mergeEvChargeBatch(List<EvCharge> list);
	void mergeChargerTypeBatch(List<ChargerType> list);
	void mergeChargerBatch(List<Charger> list);
	void mergeStatusBatch(List<ChargerStatus> list);
	
	List<Map<String,Object>> selectChargerStatusByStatIds(List<String> statIds);
	List<Map<String,Object>> selectChargersByStatIds(List<String> statIds);
	
	List<String> selectAvailableStatIds(String zcode, String type, Integer minKw);
}
