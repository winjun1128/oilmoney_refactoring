package com.app.service.users.impl;

import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;

import javax.servlet.ServletContext;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

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
	
	@Autowired
	ServletContext servletContext;

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
		System.out.println("[Service] insertUser 호출 전 : " + user);
		if(user.getProfileUrl() == null || user.getProfileUrl().isEmpty()){
	        user.setProfileUrl("/images/mypage/profile.jpg");
	    }
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

//	@Override
//	public boolean updateUserInfo(Users users, String newPw, MultipartFile profile) {
//		try {
//			if (profile != null && !profile.isEmpty()) {
//	            String uploadDir = servletContext.getRealPath("/resources/images/mypage/");
//	            String filename = users.getUserId() + "_" + System.currentTimeMillis() + "_" + profile.getOriginalFilename();
//	            Path filePath = Paths.get(uploadDir, filename);
//	            Files.write(filePath, profile.getBytes());
//	            users.setProfileUrl("/resources/images/mypage/" + filename); // DB에 저장되는 URL
//	        }
//	        int result = usersDAO.updateUserInfo(users, newPw);
//	        return result > 0;
//	    } catch (Exception e) {
//	        e.printStackTrace();
//	        return false;
//        }
//	}
	
	@Override
	public boolean updateUserInfo(Users users, String newPw, MultipartFile profile) {
	    try {
	        System.out.println("[Service] 업데이트 시작: " + users);
	        String uploadDir = servletContext.getRealPath("/resources/images/mypage/");
	        // 파일 저장 여부 확인
	        if (profile != null) {
	            System.out.println("[Service] 프로필 파일 존재: " + profile.getOriginalFilename());
	        } else {
	            System.out.println("[Service] 프로필 파일 없음");
	        }

	        // 업로드 디렉토리 존재 여부 확인
	        Path uploadPath = Paths.get(uploadDir);
	        if (!Files.exists(uploadPath)) {
	            System.out.println("[Service] uploadDir 없음, 생성 시도: " + uploadDir);
	            Files.createDirectories(uploadPath);
	        }

	        // 파일 저장
	        if (profile != null && !profile.isEmpty()) {
	            String filename = users.getUserId() + "_" + System.currentTimeMillis() + "_" + profile.getOriginalFilename();
	            Path filePath = uploadPath.resolve(filename);
	            Files.write(filePath, profile.getBytes());
	            users.setProfileUrl("/uploads/profile/" + filename);
	            System.out.println("[Service] 파일 저장 성공: " + filePath.toString());
	        }

	        // DAO 업데이트
	        int result = usersDAO.updateUserInfo(users, newPw);
	        System.out.println("[Service] DAO 업데이트 결과: " + result);

	        return result > 0;
	    } catch (Exception e) {
	        System.out.println("[Service] 예외 발생!");
	        e.printStackTrace();
	        return false;
	    }
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

	@Override
	public int countFavByUserId(String userId) {
		int result = usersDAO.countFavByUserId(userId);
		System.out.println("[Service] 즐겨찾기 개수 : " + result);
		return result;
	}

}
