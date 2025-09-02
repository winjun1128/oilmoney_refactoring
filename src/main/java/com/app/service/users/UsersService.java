package com.app.service.users;

import org.springframework.web.multipart.MultipartFile;

import com.app.dto.users.Users;

public interface UsersService {
	boolean isUserIdAvailable(String userId);
	void insertEmailCode(String email);
	String getCodeByEmail(String email);
	boolean insertUser(Users user);
	
    Users getUserInfo(String userId);
    boolean updateUserInfo(Users users, String newPw, MultipartFile profile);
    
    Users login(String userId, String pw);
    
    boolean deleteUser(String userId, String pw);
    
    int countFavByUserId(String userId);
}
