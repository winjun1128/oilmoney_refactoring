package com.app.service.charge;

import java.util.List;

import com.app.dto.ChargeDTO;
import com.app.dto.ChargeSearchDTO;
import com.app.dto.OilSearchDTO;
import com.app.dto.StationDTO;

public interface ChargeService {

	int saveChargeInfoList(List<ChargeDTO> data);
	
	int saveChargeInfo(ChargeDTO data);

	List<ChargeDTO> findCharger(ChargeSearchDTO dto);

	List<ChargeDTO> chargeFilter(ChargeSearchDTO dto);


}
