package com.app.dao.users;

import java.util.List;

import com.app.dto.users.EnergyRecord;

public interface EnergyRecordDAO {
	EnergyRecord insertRecord(EnergyRecord record);
    List<EnergyRecord> selectRecordsByCarId(int carId);
    void deleteRecord(int recordId);
}
