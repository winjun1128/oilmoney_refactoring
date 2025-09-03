package com.app.dao.route.gas;

import java.util.List;

import com.app.dto.route.GasStation;
import com.app.dto.route.GasStationRow;

public interface GasStationDAO {
	public List<GasStation> selectAll(String sidoCd, String sigunCd);
	public List<String> selectUniCdBySido(String sidoCd);
	public List<String> selectAllUniCd();
	int updatePrices(String uni, Integer gas, Integer diesel, Integer premium,
            Integer kerosene, Integer lpg, String baseTs);
	GasStationRow selectOne(String uni);
	  List<GasStationRow> selectAllWithAnyPrice(); // ANY(price_*) IS NOT NULL
	
	  //인서트
	public int mergeOne(GasStation e);
	public int mergeList(List<GasStation> list);
}
