package com.app.dao.users.impl;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

import org.mybatis.spring.SqlSessionTemplate;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Repository;

import com.app.dao.users.UsersDAO;
import com.app.dto.users.Car;
import com.app.dto.users.EmailCode;
import com.app.dto.users.Users;

@Repository
public class UsersDAOImpl implements UsersDAO {

	@Autowired
	SqlSessionTemplate sqlSessionTemplate;

	@Override
	public int countByUserId(String userId) {
		int result = sqlSessionTemplate.selectOne("users_mapper.countByUserId", userId);
		System.out.println("[DAO] countByUserId : " + userId + ", 갯수 : " + result);
		return result;
	}

	@Override
	public void insertEmailCode(EmailCode emailCode) {
		int result = sqlSessionTemplate.insert("users_mapper.insertEmailCode", emailCode);
		System.out.println("[DAO] insertEmailCode : " + emailCode + ", " + result);
	}

	@Override
	public String getCodeByEmail(String email) {
		String result = sqlSessionTemplate.selectOne("users_mapper.getCodeByEmail", email);
		System.out.println("[DAO] getCodeByEmail : " + email + ", 전송 코드 : " + result);
		return result;
	}

	@Override
	public int insertUser(Users user) {
		int result = sqlSessionTemplate.insert("users_mapper.insertUser", user);
		System.out.println("[DAO] insertUser : " + user + ", " + result);
		return result;
	}

	@Override
	public Users getUserInfo(String userId) {
		Users users = sqlSessionTemplate.selectOne("users_mapper.getUserInfo", userId);
		System.out.println("[DAO] 사용자 정보 조회 : " + userId + ", 사용자 : " + users);
		return users;
	}

	@Override
	public int updateUserInfo(Users users, String newPw) {
		Map<String, Object> newInfo = new HashMap<>();
		newInfo.put("userId", users.getUserId());
		newInfo.put("email", users.getEmail());
		newInfo.put("phoneNum", users.getPhoneNum());
		newInfo.put("addr", users.getAddr());
		newInfo.put("newPw", newPw);
		newInfo.put("profileUrl", users.getProfileUrl());

		int result = sqlSessionTemplate.update("users_mapper.updateUserInfo", newInfo);
		System.out.println("[DAO] 사용자 정보 수정 : " + users + ", 결과 : " + result);
		return result;
	}

	@Override
	public Users login(String userId, String pw) {
		Map<String, Object> loginUser = new HashMap<>();
		loginUser.put("userId", userId);
		loginUser.put("pw", pw);

		Users result = sqlSessionTemplate.selectOne("users_mapper.loginUser", loginUser);
		System.out.println("[DAO] 로그인 시도 : " + userId + ", 결과 : " + result);
		return result;
	}

	@Override
	public int deleteUser(String userId) {
		int result = sqlSessionTemplate.delete("users_mapper.deleteUser", userId);
		System.out.println("[DAO] 회원탈퇴 : " + userId + ", 결과 : " + result);
		return result;
	}

	@Override
	public int countFavByUserId(String userId) {
		int result = sqlSessionTemplate.selectOne("users_mapper.countFavByUserId", userId);
		System.out.println("[DAO] 즐겨찾기 : " + userId + ", 갯수 : " + result);
		return result;
	}

	@Override
	public int countReviewsByUserId(String userId) {
		int result = sqlSessionTemplate.selectOne("users_mapper.countReviewsByUserId", userId);
		System.out.println("[DAO] 리뷰 : " + userId + ", 갯수 : " + result);
		return result;
	}
	
	@Override
	public int countCarByUserId(String userId) {
		int result = sqlSessionTemplate.selectOne("users_mapper.countCarByUserId", userId);
		System.out.println("[DAO] 차 : " + userId + ", 갯수 : " + result);
		return result;
	}

	@Override
	public int insertMyCar(Car car) {
		int result = sqlSessionTemplate.insert("users_mapper.insertMyCar", car);
		System.out.println("[DAO] 차량 등록 : " + car + ", 결과 : " + result);
		return result;
	}

	@Override
	public List<Car> getCarsByUserId(String userId) {
		List<Car> result = sqlSessionTemplate.selectList("users_mapper.getCarsByUserId", userId);
		System.out.println("[DAO] 등록 차량 조회 : " + userId + ", 차량 목록 : " + result);
		return result;
	}

	@Override
	public int deleteCar(Car car) {
		int result = sqlSessionTemplate.delete("users_mapper.deleteCar", car);
		System.out.println("[DAO] 차량 삭제 : " + car + ", 결과 : " + result);
		return result;
	}

	@Override
	public Users getUserByEmail(String email) {
		Users users = sqlSessionTemplate.selectOne("users_mapper.getUserByEmail", email);
	    System.out.println("[DAO] 이메일로 사용자 정보 조회 : " + email + ", 사용자 : " + users);
	    return users;
	}

	@Override
	public int setMainCar(int carId) {
		int result = sqlSessionTemplate.update("users_mapper.setMainCar", carId);
		System.out.println("[DAO] setMainCar 실행 - carId: " + carId);
		return result;
	}

	@Override
	public int resetMainCar(String userId) {
		int result = sqlSessionTemplate.update("users_mapper.resetMainCar", userId);
		System.out.println("[DAO] resetMainCar 실행 - userId: " + userId);
		return result;
	}

	

}
