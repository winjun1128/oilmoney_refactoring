package com.app.controller;

import java.util.List;

import com.app.dto.OilAll.OilAllPrice;
import com.app.dto.OilPriceSido.OilPriceSido;
import com.app.dto.SiGun.SigunCodeResult;
import com.app.dto.AvgRecentPrice.AvgRecentPrice;
import com.app.dto.LowerTop.LowerTopPrice;
import com.app.service.AvgRecentPriceService;
import com.app.service.LowerTopService;
import com.app.service.OilAllPriceService;
import com.app.service.OilPriceSidoService;
import com.app.service.SiGunService;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
public class OilPriceController {

	@Autowired
	private LowerTopService lowerTopService;
	
	@Autowired
	private OilAllPriceService oilAllPriceService;
	
	@Autowired
	private OilPriceSidoService oilPriceSidoService;
	
	@Autowired
	private	AvgRecentPriceService avgRecentPriceService;
	
	@Autowired
	private SiGunService siGunService;
	
    @GetMapping("/main/oilPrice/allavg")
    public List<OilAllPrice> getOilAllPrice() {
    	
    	System.out.println("전국 평균가 유가정보");
    	List<OilAllPrice> data = oilAllPriceService.getAndProcessOilPrices();
    	
        return data;
    }
    
    @GetMapping("/main/oilPrice/sido")
    public List<OilPriceSido> getOilPriceSido() {
    	
    	System.out.println("시,도 별 평균 유가정보");
    	List<OilPriceSido> data = oilPriceSidoService.getAndProcessOilPrices();
    	System.out.println(data);
        return data;
    }

    @GetMapping("/main/oilPrice/avgrecent")
    public List<AvgRecentPrice> getAvgRecentPrice() {
    	
    	System.out.println("최근 일주일 평균가 그래프 출력");
    	List<AvgRecentPrice> data = avgRecentPriceService.getAndProcessOilPrices();

        return data;
    }
    
    // 시,도를 선택하고
    @GetMapping("/main/oilPrice/sigun")
    public SigunCodeResult getSigunList(@RequestParam String area) {
    	
    	System.out.println("지역 클릭시 파라미터 지역 코드 전달");
    	
    	SigunCodeResult scr = siGunService.getSigunList(area);
    	
        return scr; // 서비스에서 Opinet areaCode.do 호출
    }
    
    // 선택된 시군 최저가 TOP 5
    @GetMapping("/main/oilPrice/lowerTop")
    public List<LowerTopPrice> getLowerTopPrices(@RequestParam String area, @RequestParam String prodcd) {
    	
    	System.out.println("최저가 top5 요청: area=" + area + ", prodcd=" + prodcd);
        
    	return lowerTopService.getAndProcessOilPrices(area, prodcd);
    }

}
