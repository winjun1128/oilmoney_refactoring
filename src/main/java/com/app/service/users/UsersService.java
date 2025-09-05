package com.app.service.users;

import java.util.List;
import java.util.Map;

import org.springframework.web.multipart.MultipartFile;

import com.app.dto.users.Car;
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
    int countReviewsByUserId(String userId);
    int countCarByUserId(String userId);
    
    boolean registerCar(Car car);
    List<Car> getCarsByUserId(String userId);
    boolean deleteCar(Car car);
    void changeMainCar(String userId, int carId);
    
    Map<String, Object> loginWithGoogle(String idToken);
}
