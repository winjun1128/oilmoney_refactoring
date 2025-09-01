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
		boolean available = usersDAO.countByUserId(userId) == 0;
		System.out.println("[Service] 아이디 중복 확인 : " + userId + ", 가능여부 : " + available);
		return available;
	}

	@Override
	public void insertEmailCode(String email) {
		String code = String.valueOf((int) (Math.random() * 900000) + 100000);
		EmailCode emailCode = new EmailCode(email, code);
		usersDAO.insertEmailCode(emailCode);
		System.out.println("[Service] 이메일 인증 코드 발송 : " + email + ", 코드 : " + code);
		emailService.sendVerificationCode(email, code); // 실제 이메일 전송
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

	@Override
	public Users getUserInfo(String userId) {
		Users users = usersDAO.getUserInfo(userId);
		System.out.println("[Service] 사용자 정보 조회 : " + users);
		return users;
	}

	@Override
	public boolean updateUserInfo(Users users, String newPw) {
		int result = usersDAO.updateUserInfo(users, newPw);
		System.out.println("[Service] 사용자 정보 수정 : " + users + ", 비밀번호 변경 여부 : " + (newPw != null && !newPw.isEmpty()));
		return result > 0;
	}

	@Override
	public Users login(String userId, String pw) {
		Users user = usersDAO.login(userId, pw);
		if (user != null) {
			System.out.println("[Service] 로그인 성공 : " + userId);
		} else {
			System.out.println("[Service] 로그인 실패 : " + userId);
		}
		return user;

	}

	@Transactional
	@Override
	public boolean deleteUser(String userId, String pw) {
		Users users = usersDAO.getUserInfo(userId);
	    if (users != null) {
	        if (users.getPw() != null && users.getPw().equals(pw)) {
	            int result = usersDAO.deleteUser(userId);
	            return result > 0;
	        }
	    }
	    return false;
	}

}
