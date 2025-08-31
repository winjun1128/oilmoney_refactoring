package com.app.dao.route.gas;

import java.util.List;

import com.app.dto.route.GasStation;

public interface GasStationDAO {
	public List<GasStation> selectAll(String sidoCd, String sigunCd);
	public List<String> selectAllUniCd();
	
	public int mergeOne(GasStation e);
	public int mergeList(List<GasStation> list);
}
