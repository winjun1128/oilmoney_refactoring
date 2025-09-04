package com.app.dao.route.gas;

import java.util.List;

import org.apache.ibatis.annotations.Param;

import com.app.dto.route.OilAvgPriceRow;

public interface OilAvgDAO {
	 /** 한 건 업서트 (MERGE) */
	  int mergeOne(@Param("row") OilAvgPriceRow row);

	  /** 여러 건 업서트 (템플릿으로 루프) */
	  void mergeBatch(@Param("rows") List<OilAvgPriceRow> rows);

	  /** 여러 시군의 평균가 조회 */
	  List<OilAvgPriceRow> selectBySiguns(@Param("sidoCd") String sidoCd,
	                                      @Param("siguns") List<String> siguns);
}
