package com.app.dto.users;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class StationInfo {
	String id;		// UNI_CD 또는 STATID
	String name;	// NAME 또는 STATNM
	String addr;
	String tel;		// TEL 또는 BUSICALL
	String type;	// 'oil' 또는 'ev'
}
