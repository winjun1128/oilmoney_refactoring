// com/app/dao/gas/impl/GasStationDAOImpl.java
package com.app.dao.route.gas.impl;

import com.app.dao.route.gas.GasStationDAO;
import com.app.dto.route.GasStation;
import com.app.dto.route.GasStationRow;

import lombok.RequiredArgsConstructor;
import org.mybatis.spring.SqlSessionTemplate;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.stereotype.Repository;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Repository
public class GasStationDAOImpl implements GasStationDAO {

	@Autowired
	SqlSessionTemplate sqlSessionTemplate;
	
	@Override
	  public List<GasStation> selectAll(String sidoCd, String sigunCd) {
	    Map<String,Object> p = new HashMap<>();
	    p.put("sidoCd",  sidoCd);
	    p.put("sigunCd", sigunCd);
	    return sqlSessionTemplate.selectList("gasStation_mapper.selectAll", p);
	  }

  // 배치 성능을 더 내고 싶으면 AppConfig에 배치 템플릿을 하나 더 등록해 두고 주입
  // @Qualifier("batchSqlSessionTemplate")
  // private final SqlSessionTemplate batchSql;


  @Override
  public int mergeOne(GasStation e) {
    // Mapper XML의 <insert id="mergeOne"> 호출
    return sqlSessionTemplate.insert("gasStation_mapper.mergeOne", e);
  }

  @Override
  public int mergeList(List<GasStation> list) {
    int cnt = 0;
    for (GasStation e : list) {
      cnt += sqlSessionTemplate.insert("gasStation_mapper.mergeOne", e);
    }
    System.out.println("insert after");
    // 배치 템플릿을 쓴다면 flushStatements()가 자동으로 호출됨
    return cnt;
  }

	@Override
	public List<String> selectAllUniCd() {
		return sqlSessionTemplate.selectList("gasStation_mapper.selectAllUniCd");
	}

	@Override
	public int updatePrices(String uni, Integer gas, Integer diesel, Integer premium, Integer kerosene, Integer lpg,
			String baseTs) {
		Map<String,Object> p = new HashMap<>();
        p.put("uni", uni);
        p.put("gas", gas);
        p.put("diesel", diesel);
        p.put("premium", premium);
        p.put("kerosene", kerosene);
        p.put("lpg", lpg);
        p.put("baseTs", baseTs);
        return sqlSessionTemplate.update("gasStation_mapper.updatePrices", p);
	}

	@Override
	public GasStationRow selectOne(String uni) {
		return sqlSessionTemplate.selectOne("gasStation_mapper.selectOne",uni);
	}

	@Override
	public List<GasStationRow> selectAllWithAnyPrice() {
		return sqlSessionTemplate.selectList("gasStation_mapper.selectAllWithAnyPrice");
	}

	@Override
	public List<String> selectUniCdBySido(String sidoCd) {
		return sqlSessionTemplate.selectList("gasStation_mapper.selectUniCdBySido",sidoCd);
	}
}
