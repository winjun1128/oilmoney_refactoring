package com.app.dao.users.impl;

import org.mybatis.spring.SqlSessionTemplate;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Repository;

import com.app.dao.users.UsersDAO;
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

}
