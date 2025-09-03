package com.app.dao.users.impl;

import java.util.List;

import org.mybatis.spring.SqlSessionTemplate;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Repository;

import com.app.dao.users.StationInfoDAO;
import com.app.dto.users.StationInfo;

@Repository
public class StationInfoDAOImpl implements StationInfoDAO {

	@Autowired
	SqlSessionTemplate sqlSessionTemplate;
	
	@Override
	public List<StationInfo> getFavStationInfo(String userId) {
		List<StationInfo> result = sqlSessionTemplate.selectList("stationInfo_mapper.getFavStationInfo", userId);
		System.out.println("[DAO] 즐겨찾기 조회 : " + userId + ", 결과 수 : " + (result != null ? result.size() : 0));
		return result;
	}

	@Override
	public List<StationInfo> getReviewsList(String userId) {
		List<StationInfo> result = sqlSessionTemplate.selectList("stationInfo_mapper.getReviewsList", userId);
		System.out.println("[DAO] 리뷰 조회 : " + userId + ", 결과 수 : " + (result != null ? result.size() : 0));
		return result;
	}

}
