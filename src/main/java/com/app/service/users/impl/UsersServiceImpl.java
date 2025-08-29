package com.app.service.users.impl;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.app.dao.users.UsersDAO;
import com.app.dto.users.EmailCode;
import com.app.dto.users.Users;
import com.app.service.users.EmailService;
import com.app.service.users.UsersService;

@Service
public class UsersServiceImpl implements UsersService {
	
	@Autowired
	UsersDAO usersDAO;
	
	@Autowired
	EmailService emailService;

	@Override
	public boolean isUserIdAvailable(String userId) {
		boolean available = usersDAO.countByUserId(userId)==0;
		System.out.println("[Service] 아이디 중복 확인 : " + userId + ", 가능여부 : " + available);
		return available;
	}

	@Override
	public void insertEmailCode(String email) {
		String code = String.valueOf((int)(Math.random()*900000)+100000);
		EmailCode emailCode = new EmailCode(email, code);
		usersDAO.insertEmailCode(emailCode);
		System.out.println("[Service] 이메일 인증 코드 발송 : " + email + ", 코드 : " + code);
		emailService.sendVerificationCode(email, code);	 //실제 이메일 전송
	}
	
	@Override
	public String getCodeByEmail(String email) {
		String code = usersDAO.getCodeByEmail(email);
		System.out.println("[Service] 이메일 코드 조회 : " + email + ", 코드 : " + code);
		return code;
	}

	@Transactional
	@Override
	public boolean insertUser(Users user) {
		int result = usersDAO.insertUser(user);
		System.out.println("[Service] 회원가입 : " + user);
		return result > 0;
	}
	
}
