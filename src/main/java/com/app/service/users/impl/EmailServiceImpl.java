package com.app.service.users.impl;

import java.util.Properties;

import javax.mail.Message;
import javax.mail.MessagingException;
import javax.mail.PasswordAuthentication;
import javax.mail.Session;
import javax.mail.Transport;
import javax.mail.internet.InternetAddress;
import javax.mail.internet.MimeMessage;

import org.springframework.stereotype.Service;

import com.app.service.users.EmailService;

@Service
public class EmailServiceImpl implements EmailService {

	private final String username = "oilmoney0821@gmail.com"; // 발신 이메일
    private final String password = "arelfdsohnulxgrj";   // 앱 비밀번호
    private final String host = "smtp.gmail.com";
    private final int port = 587;
    private final boolean auth = true;
    private final boolean starttls = true;
    
	@Override
	public void sendVerificationCode(String email, String code) {
		try {
			// 1. SMTP 서버 설정
			Properties props = new Properties();
			props.put("mail.smtp.auth", auth);
			props.put("mail.smtp.starttls.enable", starttls);
			props.put("mail.smtp.host", host);
			props.put("mail.smtp.port", port);
			props.put("mail.smtp.ssl.protocols", "TLSv1.2");

			// 2. 세션 생성
			Session session = Session.getInstance(props, new javax.mail.Authenticator() {
				protected PasswordAuthentication getPasswordAuthentication() {
					return new PasswordAuthentication(username, password);
				}
			});

			// 3. 메시지 생성
			Message msg = new MimeMessage(session);
			msg.setFrom(new InternetAddress(username));
			msg.setRecipients(Message.RecipientType.TO, InternetAddress.parse(email));
			msg.setSubject("PowerUP 회원가입 이메일 인증 코드");
			msg.setText("인증코드는 " + code + "입니다.\n코드를 입력해 인증을 완료해주세요.");

			// 4. 이메일 전송
			Transport.send(msg);
			System.out.println("[EmailService] 이메일 전송 완료 : " + email + ", 코드 : " + code);
		} catch (MessagingException e) {
			e.printStackTrace();
			System.out.println("[EmailService] 이메일 전송 실패 : " + email);
		}
	}

}
