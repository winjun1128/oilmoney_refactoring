package com.app.service.users.impl;

import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import com.app.dao.users.StationInfoDAO;
import com.app.dto.users.StationInfo;
import com.app.service.users.StationInfoService;

@Service
public class StationInfoServiceImpl implements StationInfoService {
	
	@Autowired
	StationInfoDAO stationInfoDAO;

	@Override
	public List<StationInfo> getFavStationInfo(String userId) {
		List<StationInfo> result = stationInfoDAO.getFavStationInfo(userId);
		System.out.println("[Service] 즐겨찾기 조회 : " + userId + ", 결과 수 : " + (result != null ? result.size() : 0));
        return result;
	}

}
