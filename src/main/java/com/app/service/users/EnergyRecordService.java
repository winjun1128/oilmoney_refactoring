package com.app.service.users;

import java.util.List;

import com.app.dto.users.EnergyRecord;

public interface EnergyRecordService {
	EnergyRecord insertRecord(EnergyRecord record);
    List<EnergyRecord> selectRecordsByCarId(int carId);
    void deleteRecord(int recordId);
}