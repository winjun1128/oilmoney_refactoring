package com.app.controller;

import java.util.HashMap;
import java.util.Map;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseBody;
import org.springframework.web.bind.annotation.RestController;

import com.app.dto.users.Users;
import com.app.service.users.UsersService;

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

}
