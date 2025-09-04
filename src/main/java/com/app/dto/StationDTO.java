package com.app.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class StationDTO {

	 /** PK: 주유소 ID */
    private String stationId;

    /** 주유소명 */
    private String name;

    /** 브랜드 (SK에너지, GS칼텍스, 현대오일뱅크, S-OIL, 기타) */
    private String brand;

    /** 주소 */
    private String address;

    /** 지역(시/도) */
    private String region;

    /** 시/군/구 */
    private String city;

    /** 위도 */
    private Double lat;

    /** 경도 */
    private Double lon;

    /** 세차장 여부 */
    private String carWash;    // "Y" / "N"

    /** 편의점 여부 */
    private String store;      // "Y" / "N"

    /** 경정비 여부 */
    private String repair;     // "Y" / "N"

    /** 셀프 주유 여부 */
    private String self;       // "Y" / "N"

    /** 품질인증 여부 */
    private String quality;    // "Y" / "N"
    
    /** LPG 판매 여부 */
    private String lpgYN;    // "Y" / "N"

    /** 24시 운영 여부 */
    private String twentyFour; // "Y" / "N"

    /** 마지막 업데이트 시간 */
    private String updateTime;
}
