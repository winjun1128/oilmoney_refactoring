package com.app.controller;

import javax.servlet.http.HttpServletRequest;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.app.dto.users.Users;
import com.app.service.users.UsersService;
import com.app.util.JwtProvider;

@RestController
public class MyPageController {

	@Autowired
	UsersService usersService;
	
	@GetMapping("/mypage")
	public ResponseEntity<?> getUserInfo(HttpServletRequest request) {
		String token = JwtProvider.extractToken(request);
		if(token == null || token.isEmpty() || !JwtProvider.isValidToken(token)) {
			return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("로그인이 필요합니다");
		}
		
		String userId = JwtProvider.getUserIdFromToken(token);
		Users users = usersService.getUserInfo(userId);
		
		System.out.println("[Controller] 조회한 사용자 정보 : " + users);
		return ResponseEntity.ok(users);
	}
	
	@PostMapping("/update")
	public String updateUserInfo(@RequestBody Users users, 
								HttpServletRequest request,
								@RequestParam(required=false) String newPw) {
		String token = JwtProvider.extractToken(request);
		if(token == null || !JwtProvider.isValidToken(token)) {
			return "인증 실패";
		}
		
		String userId = JwtProvider.getUserIdFromToken(token);
		users.setUserId(userId);
		
		boolean updated = usersService.updateUserInfo(users, newPw);
		
		if(updated) {
			return "정보가 수정되었습니다.";
		} else {
			return "정보 수정 실패";
		}
	}
}
