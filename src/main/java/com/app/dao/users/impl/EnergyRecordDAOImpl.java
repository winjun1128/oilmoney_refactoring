package com.app.dao.users.impl;

import java.util.List;

import org.mybatis.spring.SqlSessionTemplate;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Repository;

import com.app.dao.users.EnergyRecordDAO;
import com.app.dto.users.EnergyRecord;

@Repository
public class EnergyRecordDAOImpl implements EnergyRecordDAO {
	
	@Autowired
	SqlSessionTemplate sqlSessionTemplate;

	@Override
	public EnergyRecord insertRecord(EnergyRecord record) {
	    sqlSessionTemplate.insert("record_mapper.insertRecord", record);
	    return record;
	}

	@Override
	public List<EnergyRecord> selectRecordsByCarId(int carId) {
		System.out.println("[DAO] selectRecordsByCarId 호출: carId = " + carId);
	    List<EnergyRecord> records = sqlSessionTemplate.selectList("record_mapper.selectRecordsByCarId", carId);
	    System.out.println("[DAO] 조회 결과: " + records);
	    return records;
	}

	@Override
	public void deleteRecord(int recordId) {
		sqlSessionTemplate.delete("record_mapper.deleteRecord", recordId);
		
	}

}
