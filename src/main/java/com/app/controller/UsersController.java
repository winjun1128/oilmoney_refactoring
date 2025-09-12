package com.app.controller;

import java.util.HashMap;
import java.util.Map;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseBody;
import org.springframework.web.bind.annotation.RestController;

import com.app.dto.users.Users;
import com.app.service.users.UsersService;
import com.app.util.JwtProvider;

@CrossOrigin(origins = "http://localhost:3000")
@RestController
@RequestMapping("/auth")
public class UsersController {

	@Autowired
	UsersService usersService;

	// 아이디 중복 체크
	@PostMapping("/check-userid")
	public boolean checkUserId(@RequestBody Users users) {
		boolean available = usersService.isUserIdAvailable(users.getUserId());
		System.out.println("[Controller] 요청 아이디 : " + users.getUserId() + ", 가능여부 : " + available);
		return available;

	}

	@PostMapping("/send-email")
	@ResponseBody
	public String sendEmail(@RequestBody Map<String, String> request) {
		String email = request.get("email");
		usersService.insertEmailCode(email);
		System.out.println("[Controller] 이메일 인증 요청 : " + email);
		return "success";
	}

	@PostMapping("/verify-code")
	@ResponseBody
	public Map<String, Boolean> verifyCode(@RequestBody Map<String, String> request) {
		String email = request.get("email");
		String inputCode = request.get("code");

		String dbCode = usersService.getCodeByEmail(email);
		boolean valid = inputCode.equals(dbCode);

		System.out.println("[Controller] 이메일 인증 코드 확인 : " + "입력코드: " + inputCode + ", DB코드: " + dbCode);

		Map<String, Boolean> response = new HashMap<>();
		response.put("valid", valid);

		return response;
	}

	@PostMapping("/signup")
	public ResponseEntity<Map<String, Object>> signup(@RequestBody Users users) {
		System.out.println("[Controller] 회원가입 요청 : " + users);

		Map<String, Object> response = new HashMap<>();
		boolean isInserted = usersService.insertUser(users);

		if (isInserted) {
			System.out.println("[Controller] 회원가입 완료: " + users.getUserId());
			response.put("success", true);
			response.put("message", "회원가입 완료");
			return ResponseEntity.ok(response);
		} else {
			System.out.println("[Controller] 회원가입 실패: " + users.getUserId());
			response.put("success", false);
			response.put("message", "회원가입 실패");
			return ResponseEntity.badRequest().body(response);
		}
	}

	// 로그인
	@PostMapping("/login")
	@ResponseBody
	public Map<String, Object> login(@RequestBody Users users) {
		Users user = usersService.login(users.getUserId(), users.getPw());
		Map<String, Object> response = new HashMap<>();

		if (user != null) {
			// JWT 생성
			String accessToken = JwtProvider.createAccessToken(user.getUserId());

			response.put("success", true);
			response.put("accessToken", accessToken);
			response.put("userInfo", user);
			System.out.println("[Controller] 로그인 성공 : " + users.getUserId());
		} else {
			response.put("success", false);
			response.put("message", "아이디 또는 비밀번호가 일치하지 않습니다.");
			System.out.println("[Controller] 로그인 실패 : " + users.getUserId());
		}
		return response;
	}
	
	// 구글 로그인
	@PostMapping("/login/oauth2/google")
	@ResponseBody
	public Map<String, Object> googleLogin(@RequestBody Map<String, String> request) {
	    String idToken = request.get("token");
	    System.out.println("[Controller] 구글 로그인 요청 토큰: " + idToken);

	    Map<String, Object> response = usersService.loginWithGoogle(idToken);
	    System.out.println("[Controller] 구글 로그인 결과: " + response);
	    
	    return response;
	}
	
	// 카카오 로그인
	@GetMapping("/kakao/url")
	@ResponseBody
	public Map<String, String> getKakaoLoginUrl() {
	    String clientId = "e9dfcb07699518cc3e766ce4afc47184"; // 정확히 입력
	    String redirectUri = "http://localhost:3000/auth/login/oauth2/kakao"; // 프론트와 동일해야 함
	    String url = "https://kauth.kakao.com/oauth/authorize?response_type=code"
	                 + "&client_id=" + clientId
	                 + "&redirect_uri=" + redirectUri;
	    Map<String, String> map = new HashMap<>();
	    map.put("url", url);
	    return map;
	}
	
	@PostMapping("/login/oauth2/kakao")
	@ResponseBody
	public Map<String, Object> kakaoLogin(@RequestBody Map<String, String> request) {
	    String code = request.get("code");
	    return usersService.loginWithKakao(code);
	}
	

	// 사용자 정보 반환
	@GetMapping("/userinfo")
	public ResponseEntity<Users> getUserInfo(@RequestHeader("Authorization") String authHeader) {
		String token = authHeader.replace("Bearer ", "");
		String userId = JwtProvider.getUserIdFromToken(token);
		Users user = usersService.getUserInfo(userId);
		return ResponseEntity.ok(user);
	}

	// 로그아웃
	@PostMapping("/logout")
	@ResponseBody
	public ResponseEntity<Map<String, Object>> logout() {
		Map<String, Object> response = new HashMap<>();
		response.put("success", true);
		response.put("message", "로그아웃 완료");
		return ResponseEntity.ok(response);
	}

	// 회원탈퇴
	@PostMapping("/delete")
	@ResponseBody
	public ResponseEntity<Map<String, Object>> deleteAccount(@RequestParam(required = false) String pw,
	        @RequestHeader("Authorization") String authHeader) {

	    Map<String, Object> response = new HashMap<>();
	    try {
	        String token = authHeader.replace("Bearer ", "");
	        String userId = JwtProvider.getUserIdFromToken(token);

	        Users user = usersService.getUserInfo(userId);
	        System.out.println("[Controller] 회원탈퇴 요청 - userId: " + userId + ", 입력 PW: " + pw + ", DB PW: " + (user != null ? user.getPw() : "null"));

	        //boolean result = usersService.deleteUser(userId, pw);
	        boolean result = false;
	        
	        // sns 계정이면 비밀번호 확인 없이 탈퇴 가능
	        if(userId.startsWith("google_")) {
	        	result = usersService.deleteUser(userId, null);
	        } else {
	        	result = usersService.deleteUser(userId, pw);
	        }
	        
	        if (result) {
	            response.put("success", true);
	            response.put("message", "회원 탈퇴 완료");
	            System.out.println("[Controller] 탈퇴 완료");
	        } else {
	            response.put("success", false);
	            response.put("message", "비밀번호가 일치하지 않음");
	        }
	    } catch (Exception e) {
	        e.printStackTrace();
	        response.put("success", false);
	        response.put("message", "탈퇴 중 오류 발생");
	    }

	    return ResponseEntity.ok(response);
	}
}
