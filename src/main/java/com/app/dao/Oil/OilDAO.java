package com.app.dao.Oil;

import java.util.List;

import com.app.dto.OilSearchDTO;
import com.app.dto.StationDTO;

public interface OilDAO {

	List<StationDTO> oilFilter(OilSearchDTO dto);

}
