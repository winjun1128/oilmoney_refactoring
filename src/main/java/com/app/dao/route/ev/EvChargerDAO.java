package com.app.dao.route.ev;

import java.util.List;

import com.app.dto.route.Charger;
import com.app.dto.route.ChargerStatus;
import com.app.dto.route.ChargerType;
import com.app.dto.route.EvCharge;

public interface EvChargerDAO {
	  List<String> selectAllStatIds();
	  void mergeEvChargeBatch(List<EvCharge> list);
	  void mergeChargerTypeBatch(List<ChargerType> list);
	  void mergeChargerBatch(List<Charger> list);
	  void mergeStatusBatch(List<ChargerStatus> list);
	  List<String> selectAllChargerKeys();
}
