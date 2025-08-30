package com.app.dao.users;

import com.app.dto.users.EmailCode;
import com.app.dto.users.Users;

public interface UsersDAO {
	int countByUserId(String userId);
	void insertEmailCode(EmailCode emailCode);
	String getCodeByEmail(String email);
	int insertUser(Users user);
	
	Users getUserInfo(String userId);
	int updateUserInfo(Users users, String newPw);
	
	Users login(String userId, String pw);
	
	int deleteUser(String userId);
}
