package com.app.dto.users;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class Car {
	int carId;
	String userId;
	String fuelType;
	String carType;
	String regDate;
	String isMain;
}
