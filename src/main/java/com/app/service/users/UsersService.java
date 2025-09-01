package com.app.service.users;

import com.app.dto.users.Users;

public interface UsersService {
	boolean isUserIdAvailable(String userId);
	void insertEmailCode(String email);
	String getCodeByEmail(String email);
	boolean insertUser(Users user);
	
    Users getUserInfo(String userId);
    boolean updateUserInfo(Users users, String newPw);
    
    Users login(String userId, String pw);
    
    boolean deleteUser(String userId, String pw);
}
