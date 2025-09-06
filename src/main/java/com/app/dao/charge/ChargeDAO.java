package com.app.dao.charge;

import java.util.List;
import java.util.Map;

import com.app.dto.ChargeDTO;
import com.app.dto.ChargeSearchDTO;

public interface ChargeDAO {

	int saveChargeInfoList(List<ChargeDTO> data);
	
	int saveChargeInfo(ChargeDTO data);

	List<ChargeDTO> findCharger(ChargeSearchDTO dto);

	List<ChargeDTO> chargeFilter(ChargeSearchDTO dto);

	List<ChargeDTO> findChargeNearby(Map<String, Object> param);

}
