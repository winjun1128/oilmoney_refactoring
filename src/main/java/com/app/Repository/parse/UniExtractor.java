package com.app.Repository.parse;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import java.util.ArrayList;
import java.util.List;

public class UniExtractor {
    public static List<String> extractUniCdList(String json) throws Exception {
        ObjectMapper om = new ObjectMapper();
        JsonNode root = om.readTree(json);

        JsonNode body = root.path("response").path("body");
        JsonNode itemsNode = body.path("items");

        List<String> result = new ArrayList<>();

        if (itemsNode.isArray()) {
            // case 1) items가 배열
            for (JsonNode item : itemsNode) {
                String uni = item.path("UNI_CD").asText(null);
                if (uni != null && !uni.isEmpty()) result.add(uni);
            }
        } else if (itemsNode.has("item") && itemsNode.get("item").isArray()) {
            // case 2) items.item 배열
            for (JsonNode item : itemsNode.get("item")) {
                String uni = item.path("UNI_CD").asText(null);
                if (uni != null && !uni.isEmpty()) result.add(uni);
            }
        }
        // 필요하면 중복 제거: new ArrayList<>(new LinkedHashSet<>(result))
        return result;
    }
}
