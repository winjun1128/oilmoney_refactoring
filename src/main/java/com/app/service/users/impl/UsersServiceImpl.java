package com.app.service.users.impl;

import java.math.BigInteger;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.security.SecureRandom;
import java.util.Collections;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

import javax.servlet.ServletContext;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.LinkedMultiValueMap;
import org.springframework.util.MultiValueMap;
import org.springframework.web.client.RestTemplate;
import org.springframework.web.multipart.MultipartFile;

import com.app.dao.users.UsersDAO;
import com.app.dto.users.Car;
import com.app.dto.users.EmailCode;
import com.app.dto.users.Users;
import com.app.service.users.EmailService;
import com.app.service.users.UsersService;
import com.app.util.JwtProvider;
import com.google.api.client.googleapis.auth.oauth2.GoogleIdToken;
import com.google.api.client.googleapis.auth.oauth2.GoogleIdTokenVerifier;
import com.google.api.client.googleapis.javanet.GoogleNetHttpTransport;
import com.google.api.client.json.jackson2.JacksonFactory;

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
		if (user.getProfileUrl() == null || user.getProfileUrl().isEmpty()) {
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
				String filename = users.getUserId() + "_" + System.currentTimeMillis() + "_"
						+ profile.getOriginalFilename();
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

//	회원탈퇴
	@Transactional
	@Override
	public boolean deleteUser(String userId, String pw) {
		Users users = usersDAO.getUserInfo(userId);
		if (users != null) {
	        // sns 계정이면 비밀번호 확인없이 탈퇴
			if (userId.startsWith("google_")) {
	            int result = usersDAO.deleteUser(userId);
				System.out.println("[Service] SNS 계정 탈퇴 처리 - userId: " + userId);
	            return result > 0;
	        }

	        // 일반 계정이면 비밀번호 확인 후 탈퇴
	        if (users.getPw() != null && users.getPw().equals(pw)) {
	            int result = usersDAO.deleteUser(userId);
	            System.out.println("[Service] 일반 계정 탈퇴 처리 - userId: " + userId);
	            return result > 0;
	        }
	    }
		System.out.println("[Service] 탈퇴 실패 - userId: " + userId + ", pw 입력: " + pw);
	    return false;
	}

	@Override
	public int countFavByUserId(String userId) {
		int result = usersDAO.countFavByUserId(userId);
		System.out.println("[Service] 즐겨찾기 개수 : " + result);
		return result;
	}

	@Override
	public int countReviewsByUserId(String userId) {
		int result = usersDAO.countReviewsByUserId(userId);
		System.out.println("[Service] 리뷰 개수 : " + result);
		return result;
	}

	@Override
	public int countCarByUserId(String userId) {
		int result = usersDAO.countCarByUserId(userId);
		System.out.println("[Service] 차 개수 : " + result);
		return result;
	}

	@Transactional
	@Override
	public boolean registerCar(Car car) {
		int result = usersDAO.insertMyCar(car);
		System.out.println("[Service] 차량 등록 요청 : " + car);
		return result > 0;
	}

	@Override
	public List<Car> getCarsByUserId(String userId) {
		List<Car> result = usersDAO.getCarsByUserId(userId);
		System.out.println("[Service] 등록한 차량 목록 : " + result);
		return result;
	}

	@Transactional
	@Override
	public boolean deleteCar(Car car) {
		return usersDAO.deleteCar(car) > 0; // 삭제 성공하면 true
	}

	@Transactional
	@Override
	public Map<String, Object> loginWithGoogle(String accessToken) {
		Map<String, Object> response = new HashMap<>();
        try {
            // Google API로 사용자 정보 가져오기
            String url = "https://www.googleapis.com/oauth2/v1/userinfo?alt=json&access_token=" + accessToken;
            RestTemplate restTemplate = new RestTemplate();
            Map<String, Object> userInfoMap = restTemplate.getForObject(url, Map.class);

            if (userInfoMap == null || userInfoMap.get("email") == null) {
                response.put("success", false);
                response.put("message", "Invalid access token or failed to fetch user info");
                return response;
            }

            String email = (String) userInfoMap.get("email");
            String name = (String) userInfoMap.get("name");
            String googleId = (String) userInfoMap.get("id");
            String profileUrl = (String) userInfoMap.get("picture");

            System.out.println("[Service] Google access token 확인, 이메일: " + email + ", 이름: " + name);

            // DB 조회
            Users user = usersDAO.getUserByEmail(email);
            if (user == null) {
                // 신규 사용자 생성
                String userId = "google_" + googleId;
                String pw = generateRandomPassword();
                user = new Users();
                user.setUserId(userId);
                user.setPw(pw);
                user.setEmail(email);
                user.setName(name);
                user.setProfileUrl(profileUrl);
                user.setState("active");
                usersDAO.insertUser(user);
                System.out.println("[Service] 신규 사용자 추가 완료: " + user);
            } else {
                System.out.println("[Service] 기존 사용자 로그인: " + user.getUserId());
            }

            // JWT 생성
            String jwt = JwtProvider.createAccessToken(user.getUserId());

            response.put("success", true);
            response.put("accessToken", jwt);
            response.put("userInfo", user);

        } catch (Exception e) {
            e.printStackTrace();
            response.put("success", false);
            response.put("message", e.getMessage());
        }

        System.out.println("[Service] 구글 로그인 처리 종료, response: " + response);
        return response;
    }

    private String generateRandomPassword() {
        return new BigInteger(130, new SecureRandom()).toString(32);
    }

    @Transactional
	@Override
	public void changeMainCar(String userId, int carId) {
		usersDAO.resetMainCar(userId);
		usersDAO.setMainCar(carId);
		System.out.println("[Service] 대표차 변경 완료 - userId : " + userId + ", carId : " + carId);
	}

	@Override
	public Car mainCarByUserId(String userId) {
		return usersDAO.mainCarByUserId(userId);
	}

	// 카카오 로그인
	@Override
	@Transactional
	public Map<String, Object> loginWithKakao(String code) {
	    Map<String, Object> response = new HashMap<>();
	    try {
	        // 1. 카카오 access token 발급
	        String tokenUrl = "https://kauth.kakao.com/oauth/token";
	        RestTemplate restTemplate = new RestTemplate();
	        MultiValueMap<String, String> params = new LinkedMultiValueMap<>();
	        params.add("grant_type", "authorization_code");
	        params.add("client_id", "e9dfcb07699518cc3e766ce4afc47184");
	        params.add("redirect_uri", "http://localhost:3000/auth/login/oauth2/kakao");
	        params.add("code", code);

	        HttpHeaders headers = new HttpHeaders();
	        headers.setContentType(MediaType.APPLICATION_FORM_URLENCODED);
	        HttpEntity<MultiValueMap<String, String>> tokenRequest = new HttpEntity<>(params, headers);
	        Map<String, Object> tokenResponse = restTemplate.postForObject(tokenUrl, tokenRequest, Map.class);

	        String accessToken = (String) tokenResponse.get("access_token");
	        System.out.println("[Kakao] Access Token: " + accessToken);
	        if (accessToken == null) {
	            response.put("success", false);
	            response.put("message", "Access token 발급 실패");
	            return response;
	        }

	        // 2. 사용자 정보 요청
	        String userUrl = "https://kapi.kakao.com/v2/user/me";
	        HttpHeaders userHeaders = new HttpHeaders();
	        userHeaders.set("Authorization", "Bearer " + accessToken);
	        HttpEntity<String> userEntity = new HttpEntity<>(userHeaders);
	        Map<String, Object> userInfoMap = restTemplate.exchange(userUrl, HttpMethod.GET, userEntity, Map.class).getBody();

	        System.out.println("[Kakao] 사용자 정보: " + userInfoMap);
	        
	        String kakaoId = String.valueOf(userInfoMap.get("id"));
	        Map<String, Object> kakaoAccount = (Map<String, Object>) userInfoMap.get("kakao_account");
	        String email = kakaoAccount.get("email") != null ? (String) kakaoAccount.get("email") : "kakao_" + kakaoId + "@kakao.com";
	        Map<String, Object> profile = (Map<String, Object>) kakaoAccount.get("profile");
	        System.out.println("프로필에 뭐가있나.... "+profile);
	        String nickname = profile != null ? (String) profile.get("nickname") : "KakaoUser";
	        String profileUrl = profile != null ? (String) profile.get("thumbnail_image_url") : "KakaoUser";
	        
	        // 3. DB 처리
	        Users user = usersDAO.getUserByEmail(email);
	        System.out.println("[DB] 이메일 조회: " + email + ", 사용자: " + user);
	        System.out.println("프로필 "+ profileUrl + "닉네임 " + nickname);
	        if (user == null) {
	            String userId = "kakao_" + kakaoId;
	            user = new Users();
	            user.setUserId(userId);
	            user.setPw(generateRandomPassword());
	            user.setEmail(email);
	            user.setName(nickname);
	            user.setProfileUrl(profileUrl);
	            user.setState("active");
	            System.out.println("[Action] 신규 사용자 등록 로직 진입");
	            int insertResult = usersDAO.insertUser(user);
	            System.out.println("[Action] insertResult: " + insertResult + ", user: " + user);

	            System.out.println(user.getUserId());
	            System.out.println(user.getPw());
	            System.out.println(user.getEmail());
	            System.out.println(user.getName());
	            System.out.println(user.getProfileUrl());
	        }

	        // 4. JWT 발급
	        String jwt = JwtProvider.createAccessToken(user.getUserId());
	        System.out.println("[Action] JWT 발급 완료: " + jwt);
	        response.put("success", true);
	        response.put("accessToken", jwt);
	        response.put("userInfo", user);

	    } catch (Exception e) {
	        e.printStackTrace();
	        response.put("success", false);
	        response.put("message", e.getMessage());
	    }
	    return response;
	}


}
