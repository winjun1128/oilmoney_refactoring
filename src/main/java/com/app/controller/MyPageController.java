package com.app.controller;

import java.io.IOException;
import java.util.Map;

import javax.servlet.ServletContext;
import javax.servlet.http.HttpServletRequest;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.ModelAttribute;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RequestPart;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

import com.app.dto.users.Users;
import com.app.service.users.UsersService;
import com.app.util.JwtProvider;

@RestController
public class MyPageController {

	@Autowired
	UsersService usersService;
	
	@Autowired
	ServletContext servletContext;
	
	@GetMapping("/mypage")
	public ResponseEntity<?> getUserInfo(HttpServletRequest request) {
		String token = JwtProvider.extractToken(request);
		if(token == null || token.isEmpty() || !JwtProvider.isValidToken(token)) {
			return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("로그인이 필요합니다");
		}
		
		String userId = JwtProvider.getUserIdFromToken(token);
		Users users = usersService.getUserInfo(userId);
		int favCount = usersService.countFavByUserId(userId);
		
		if(users.getProfileUrl() == null || users.getProfileUrl().isEmpty()){
	        users.setProfileUrl("/images/mypage/profile.jpg");
	    }
		
		System.out.println("[Controller] 조회한 사용자 정보 : " + users);
		System.out.println("[Controller] 즐겨찾기 갯수 : " + favCount);
		
		Map<String, Object> response = Map.of(
		        "userInfo", users,
		        "favCount", favCount
		    );
		
		return ResponseEntity.ok(response);
	}
	
	@PostMapping("/update")
	public ResponseEntity<?> updateUserInfo(
			@RequestParam String email,
			@RequestParam String phoneNum,
			@RequestParam String addr,
			@RequestParam(required=false) String newPw,
			@RequestParam(required=false) MultipartFile profile,
	        HttpServletRequest request
	) {
	    String token = JwtProvider.extractToken(request);
	    if(token == null || !JwtProvider.isValidToken(token)) {
	        return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("인증 실패");
	    }

	    String userId = JwtProvider.getUserIdFromToken(token);

	    Users users = new Users();
	    users.setUserId(userId);
	    users.setEmail(email);
	    users.setPhoneNum(phoneNum);
	    users.setAddr(addr);

	    boolean updated = usersService.updateUserInfo(users, newPw, profile);
	    if (updated) {
	    	System.out.println("[Controller] 개인정보 수정 : " + updated);
            return ResponseEntity.ok("정보가 수정되었습니다.");
        } else {
        	System.out.println("[Controller] 개인정보 수정 : " + updated);
            return ResponseEntity.status(500).body("정보 수정 실패");
        }
	}
	
}
