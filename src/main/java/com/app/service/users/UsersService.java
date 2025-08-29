package com.app.service.users;

import com.app.dto.users.Users;

public interface UsersService {
	boolean isUserIdAvailable(String userId);
	void insertEmailCode(String email);
	String getCodeByEmail(String email);
	boolean insertUser(Users user);
}
