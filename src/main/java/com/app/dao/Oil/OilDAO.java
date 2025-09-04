package com.app.dao.Oil;

import java.util.List;
import java.util.Map;

import com.app.dto.OilSearchDTO;
import com.app.dto.StationDTO;

public interface OilDAO {

	List<StationDTO> oilFilter(OilSearchDTO dto);

	List<StationDTO> findNearby(Map<String, Object> param);

}
