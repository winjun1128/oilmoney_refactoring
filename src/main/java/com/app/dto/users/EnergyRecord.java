package com.app.dto.users;

import java.time.LocalDate;
import java.time.LocalDateTime;

import com.fasterxml.jackson.annotation.JsonFormat;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class EnergyRecord {
	int recordId;       // 기록 ID
    int carId;          // 차량 ID
    
    @JsonFormat(shape = JsonFormat.Shape.STRING, pattern = "yyyy-MM-dd")
    LocalDate recordDate;
    
    String station;     // 주유/충전소 이름
    Double amount;      // 리터, kWh, kg
    Integer price;      // 금액
    String fuelType;
}
