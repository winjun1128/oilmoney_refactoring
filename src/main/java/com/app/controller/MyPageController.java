package com.app.controller;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

import javax.servlet.ServletContext;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpSession;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

import com.app.dto.users.Car;
import com.app.dto.users.StationInfo;
import com.app.dto.users.Users;
import com.app.service.users.StationInfoService;
import com.app.service.users.UsersService;
import com.app.util.JwtProvider;

@RestController
public class MyPageController {

	@Autowired
	UsersService usersService;

	@Autowired
	ServletContext servletContext;
	
	@Autowired
	StationInfoService stationInfoService;

	@GetMapping("/mypage")
	public ResponseEntity<?> getUserInfo(HttpServletRequest request) {
		String token = JwtProvider.extractToken(request);
		if (token == null || token.isEmpty() || !JwtProvider.isValidToken(token)) {
			return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("로그인이 필요합니다");
		}

		String userId = JwtProvider.getUserIdFromToken(token);
		Users users = usersService.getUserInfo(userId);

		int favCount = usersService.countFavByUserId(userId);
		int reviewCount = usersService.countReviewsByUserId(userId);
		int carCount = usersService.countCarByUserId(userId);

		List<Car> cars = usersService.getCarsByUserId(userId);
		List<StationInfo> stationInfo = stationInfoService.getFavStationInfo(userId);

		if (users.getProfileUrl() == null || users.getProfileUrl().isEmpty()) {
			users.setProfileUrl("/images/mypage/profile.jpg");
		}

		System.out.println("[Controller] 조회한 사용자 정보 : " + users);
		System.out.println("[Controller] 등록 차량 : " + cars);
		System.out.println("[Controller] 등록 차량 수 : " + carCount);
		System.out.println("[Controller] 즐겨찾기 : " + stationInfo);
		System.out.println("[Controller] 즐겨찾기 갯수 : " + favCount);
		
		System.out.println("[Controller] 리뷰 갯수 : " + reviewCount);
		

		Map<String, Object> response = new HashMap<>();
		response.put("userInfo", users != null ? users : new Users());
		response.put("carCount", carCount);
		response.put("favCount", favCount);
		response.put("reviewCount", reviewCount);
		response.put("cars", cars != null ? cars : List.of());
		response.put("stationInfo", stationInfo != null ? stationInfo : List.of());

		return ResponseEntity.ok(response);
	}

//	개인정보 수정
	@PostMapping("/update")
	public ResponseEntity<?> updateUserInfo(@RequestParam String email, @RequestParam String phoneNum,
			@RequestParam String addr, @RequestParam(required = false) String newPw,
			@RequestParam(required = false) MultipartFile profile, HttpServletRequest request) {
		String token = JwtProvider.extractToken(request);
		if (token == null || !JwtProvider.isValidToken(token)) {
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

//	차 등록
	@PostMapping("/registcar")
	public ResponseEntity<?> registCar(@RequestBody Car car, HttpServletRequest request) {
		String token = JwtProvider.extractToken(request);
		if (token == null || !JwtProvider.isValidToken(token)) {
			return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("로그인이 필요합니다");
		}

		String userId = JwtProvider.getUserIdFromToken(token);
		car.setUserId(userId); // JWT에서 가져온 userId 세팅

		boolean success = usersService.registerCar(car);
		if (success) {
			// 등록 후 가장 최근 차량 조회
			int carCount = usersService.countCarByUserId(userId);
			System.out.println("[Controller] 차량 등록 : " + success);
			return ResponseEntity.ok(Map.of("newCar", car, "carCount", carCount));
		} else {
			System.out.println("[Controller] 차량 등록 : " + success);
			return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body("차량 등록 실패");
		}
	}

//	차 삭제
	@PostMapping("/deletecar")
	public ResponseEntity<?> deleteCar(@RequestBody Car car, HttpServletRequest request) {
		String token = JwtProvider.extractToken(request);
		if (token == null || !JwtProvider.isValidToken(token)) {
			return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("로그인이 필요합니다");
		}

		String userId = JwtProvider.getUserIdFromToken(token);
		car.setUserId(userId);

		boolean success = usersService.deleteCar(car);
		if (success) {
			System.out.println("[Controller] 차량 삭제 성공 : " + car);
			return ResponseEntity.ok("삭제 성공");
		} else {
			System.out.println("[Controller] 차량 삭제 실패 : " + car);
			return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body("삭제 실패");
		}
	}
	
//	즐겨찾기 목록
	@PostMapping("/favorites")
	public ResponseEntity<?> getFavoriteStations(HttpServletRequest request) {
	    String token = JwtProvider.extractToken(request);
	    if (token == null || !JwtProvider.isValidToken(token)) {
	        return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(List.of());
	    }

	    String userId = JwtProvider.getUserIdFromToken(token);
	    List<StationInfo> stationInfo = stationInfoService.getFavStationInfo(userId);

	    return ResponseEntity.ok(stationInfo != null ? stationInfo : List.of());
	}
	
}
