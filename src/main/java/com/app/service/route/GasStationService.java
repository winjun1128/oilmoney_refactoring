package com.app.service.route;

import java.util.List;
import java.util.Map;

public interface GasStationService {
  public Map<String,Object> getAllFromDb(String sidoCd,String sigunCd);
  public List<String> selectAllUniCd();
  
  public int refreshAllOilPrices();
}
