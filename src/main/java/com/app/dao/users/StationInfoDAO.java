package com.app.dao.users;

import java.util.List;

import com.app.dto.users.StationInfo;

public interface StationInfoDAO {
	List<StationInfo> getFavStationInfo(String userId);
}
