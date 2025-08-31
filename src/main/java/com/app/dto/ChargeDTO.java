package com.app.dto;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonProperty;

import java.time.LocalDateTime;

import com.fasterxml.jackson.annotation.JsonFormat;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@JsonIgnoreProperties(ignoreUnknown = true)
public class ChargeDTO {
	/** PK: 충전소코드 */
    private String statId;
    /** 충전소명 */
    private String statNm;
    /** 주소 */
    private String addr;
    /** 위도(문자열로 제공되므로 String 유지. 필요시 Double로 변경) */
    private String lat;
    /** 경도(문자열로 제공되므로 String 유지. 필요시 Double로 변경) */
    private String lng;
    /** 이용가능 시간 */
    private String useTime;
    /** 지역코드 */
    private String zcode;
    /** 지역구분 상세코드(JSON: zscode) */
    @JsonProperty("zscode")
    private String scode;
    /** 층안내(층수) */
    private String floorNum;
    /** 층타입(F/B 등) */
    private String floorType;
    /** 운영사ID(JSON: busiId) */
    @JsonProperty("busiId")
    private String busId;
    /** 운영사명 */
    private String busiNm;
    /** 고객센터 */
    private String busiCall;
    /** 업데이트된 시간 (DB: updated_at) */
    private String updatedAt;
}
