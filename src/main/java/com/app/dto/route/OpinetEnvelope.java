// OpinetEnvelope.java
package com.app.dto.route;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonProperty;
import java.util.List;

@JsonIgnoreProperties(ignoreUnknown = true)
public class OpinetEnvelope {
  public Response response;

  @JsonIgnoreProperties(ignoreUnknown = true)
  public static class Response {
    public Header header;
    public Body body;
  }

  @JsonIgnoreProperties(ignoreUnknown = true)
  public static class Header {
    public String resultCode;
    public String resultMsg;
  }

  @JsonIgnoreProperties(ignoreUnknown = true)
  public static class Body {
    public String pageNo;
    public int totalCount;
    public String numOfRows;
    public List<Station> items;
  }

  @JsonIgnoreProperties(ignoreUnknown = true)
  public static class Station {
    @JsonProperty("UNI_CD")      public String uniCd;
    @JsonProperty("POLL_DIV_CO") public String brand;
    @JsonProperty("GPOLL_DIV_CO")public String brandGroup;
    @JsonProperty("OS_NM")       public String name;
    @JsonProperty("TEL")         public String tel;

    @JsonProperty("NEW_ADR")     public String addr;
    @JsonProperty("VAN_ADR")     public String addrOld;
    @JsonProperty("SIDO_CD")     public String sidoCd;
    @JsonProperty("SIGUN_CD")    public String sigunCd;

    @JsonProperty("SELF_YN")     public String selfYn;
    @JsonProperty("CVS_YN")      public String cvsYn;
    @JsonProperty("CAR_WASH_YN") public String carWashYn;
    @JsonProperty("MAINT_YN")    public String maintYn;
    @JsonProperty("KPETRO_YN")   public String kpetroYn;
    @JsonProperty("LPG_YN")      public String lpgYn;

    @JsonProperty("X")           public String xWeb;
    @JsonProperty("Y")           public String yWeb;
    @JsonProperty("GIS_X_COOR")  public String xKatec;
    @JsonProperty("GIS_Y_COOR")  public String yKatec;

    @JsonProperty("MOFY_DT")     public String modifiedYmd; // 'YYYYMMDD'
  }
}
