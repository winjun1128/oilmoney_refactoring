package com.app.dao.users;

import java.util.List;

import org.apache.ibatis.annotations.Param;

import com.app.dto.users.Car;
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
	
	int countFavByUserId(@Param("userId") String userId);
	int countReviewsByUserId(@Param("userId") String userId);
	int countCarByUserId(@Param("userId") String userId);
	
	int insertMyCar(Car car);
	List<Car> getCarsByUserId(String userId);
	int deleteCar(Car car);
	
	Users getUserByEmail(String email);
}
