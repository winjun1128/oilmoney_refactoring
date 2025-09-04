package com.app.service.users;

public interface EmailService {
	void sendVerificationCode(String email, String code);
}
