package com.app.service.users;

import java.util.List;

import com.app.dto.users.StationInfo;

public interface StationInfoService {
	List<StationInfo> getFavStationInfo(String userId);
	List<StationInfo> getReviewsList(String userId);
}
