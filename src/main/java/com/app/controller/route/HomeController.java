package com.app.controller.route;

import java.io.IOException;
import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.app.controller.api.EVInfo;
import com.app.dto.ChargeDTO;
import com.app.service.charge.ChargeService;


@Controller
public class HomeController {
	@Autowired
	ChargeService chargeService;

	@GetMapping("/")
	public String main() {
		return "mainpage";
	}

	@GetMapping("/api")
	public String home() throws IOException {
		EVInfo evInfo = new EVInfo();

		for(int i=1; i<=192; i++) {
			List<ChargeDTO> data = evInfo.findCharge(i);

			for (ChargeDTO dt : data) {
					int chargeList = chargeService.saveChargeInfo(dt);
			}
		}
		
		System.out.println("작업완료");
		return "redirect:/";
	}

}