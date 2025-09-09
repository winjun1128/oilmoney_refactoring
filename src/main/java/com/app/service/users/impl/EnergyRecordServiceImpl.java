package com.app.service.users.impl;

import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import com.app.dao.users.EnergyRecordDAO;
import com.app.dto.users.EnergyRecord;
import com.app.service.users.EnergyRecordService;

@Service
public class EnergyRecordServiceImpl implements EnergyRecordService {
	
    @Autowired
    EnergyRecordDAO energyRecordDAO;

	@Override
	public EnergyRecord insertRecord(EnergyRecord record) {
		System.out.println("[Service] insertRecord 호출: " + record);
		energyRecordDAO.insertRecord(record); 
	    return record;
	}

	@Override
	public List<EnergyRecord> selectRecordsByCarId(int carId) {
		System.out.println("[Service] selectRecordsByCarId 호출: carId = " + carId);
        List<EnergyRecord> records = energyRecordDAO.selectRecordsByCarId(carId);
        System.out.println("[Service] 조회 결과: " + records);
        return records;
	}

	@Override
	public void deleteRecord(int recordId) {
		System.out.println("[Service] deleteRecord 호출: recordId = " + recordId);
        energyRecordDAO.deleteRecord(recordId);
		
	}

}
