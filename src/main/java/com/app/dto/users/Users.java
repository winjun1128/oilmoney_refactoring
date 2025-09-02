package com.app.dto.users;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class Users {
	String userId;
	String pw;
	String email;
	String name;
	
	String phoneNum;
	String addr;
	String state;
	String profileUrl;
}
