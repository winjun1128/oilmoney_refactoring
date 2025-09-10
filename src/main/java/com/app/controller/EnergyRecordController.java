package com.app.controller;

import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RestController;

import com.app.dto.users.EnergyRecord;
import com.app.service.users.EnergyRecordService;

@RestController
public class EnergyRecordController {
	
	@Autowired
	EnergyRecordService energyRecordService;
	
	// 기록 추가
    @PostMapping("/{carId}/energy")
    public ResponseEntity<?> addRecord(@PathVariable int carId, @RequestBody EnergyRecord record) {
    	System.out.println("[Controller] addRecord 호출: carId=" + carId + ", record=" + record);
        record.setCarId(carId);
        EnergyRecord savedRecord = energyRecordService.insertRecord(record); // 저장 후 반환
        return ResponseEntity.ok(savedRecord);
    }

    // 기록 조회
    @GetMapping("/{carId}/energy")
    public ResponseEntity<?> getRecords(@PathVariable int carId) {
    	try {
            System.out.println("[Controller] getRecords 호출: carId=" + carId);
            List<EnergyRecord> records = energyRecordService.selectRecordsByCarId(carId);
            System.out.println("[Controller] 조회 결과: " + records);
            return ResponseEntity.ok(records != null ? records : List.of());
        } catch(Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                                 .body("연료 기록 조회 실패");
        }
    }


    // 기록 삭제
    @PostMapping("/energy/{recordId}")
    public ResponseEntity<?> deleteRecord(@PathVariable int recordId) {
    	System.out.println("[Controller] deleteRecord 호출: recordId=" + recordId);
        energyRecordService.deleteRecord(recordId);
        return ResponseEntity.ok("삭제 완료");
    }
}
