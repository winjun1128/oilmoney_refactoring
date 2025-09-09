package com.app.service.Oil;

import java.util.List;

import com.app.dto.OilSearchDTO;
import com.app.dto.StationDTO;

public interface OilService {

	List<StationDTO> oilFilter(OilSearchDTO dto);

	List<StationDTO> findNearby(Double lat, Double lon, Integer radius);

	List<StationDTO> findFavOilStations(String userId);

}
