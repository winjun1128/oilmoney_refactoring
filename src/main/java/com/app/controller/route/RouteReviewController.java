package com.app.controller.route;

import com.app.service.route.ReviewService;
import com.app.util.JwtProvider;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import javax.servlet.http.HttpServletRequest;

import java.time.LocalDateTime;
import java.time.OffsetDateTime;
import java.time.format.DateTimeFormatter;
import java.util.*;
import java.util.stream.Collectors;

@RestController
@RequestMapping(value = "/api/route/reviews", produces = MediaType.APPLICATION_JSON_VALUE)
public class RouteReviewController {
	
	private static final DateTimeFormatter FMT = DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm");

	private String fmt(OffsetDateTime dt) {
	    return dt == null ? null : dt.format(FMT);
	}

    @Autowired
    ReviewService reviewService;

    // GET /api/route/reviews?key=...&page=1&size=5
    @GetMapping
    public ResponseEntity<?> list(
            @RequestParam("key") String key,
            @RequestParam(value = "page", defaultValue = "1") int page,
            @RequestParam(value = "size", defaultValue = "5") int size,
            HttpServletRequest request
    ) {
        String token = JwtProvider.extractToken(request);
        String userIdOrNull = JwtProvider.getUserIdFromToken(token); // 로그인 안 했으면 null

        ReviewService.PagedResult res = reviewService.list(key, userIdOrNull, page, size);

        List<Map<String, Object>> items = res.items.stream().map(r -> {
            Map<String, Object> m = new HashMap<>();
            m.put("id", r.getId());

            // ✅ 익명 대신 DB의 USER_ID를 표기로 사용
            m.put("user", r.getUserId() != null ? r.getUserId() : "익명");

            m.put("rating", r.getRating());
            m.put("text", r.getText());

             // ✅ 두 값을 각각 내려준다 (문자열/ISO 그대로 내려도 OK)
            m.put("createdAt", fmt(r.getCreatedAt()));
            m.put("updatedAt", fmt(r.getUpdatedAt()));
             // (선택) 하위호환이 필요하면 유지
             // var baseTs = (r.getUpdatedAt() != null) ? r.getUpdatedAt() : r.getCreatedAt();
             // m.put("ts", fmt(baseTs));
             
            // mine은 그대로
            m.put("mine", Objects.equals(r.getUserId(), userIdOrNull));
            return m;
        }).collect(Collectors.toList());

        Map<String, Object> out = new HashMap<>();
        out.put("items", items);
        out.put("hasMore", res.hasMore);
        out.put("avg", res.avg);
        out.put("count", res.count);
        return ResponseEntity.ok(out);
    }

    // POST /api/route/reviews
    @PostMapping
    public ResponseEntity<?> create(@RequestBody CreateReq req, HttpServletRequest request) {
        String token = JwtProvider.extractToken(request);
        String userId = JwtProvider.getUserIdFromToken(token);
        if (userId == null) {
            return ResponseEntity.status(401).body(Map.of("error", "unauthorized"));
        }

        // ⬇️ USER_NAME/CLIENT_ID 제거한 create 시그니처로 호출
        long id = reviewService.create(req.key, userId, req.rating, req.text);
        return ResponseEntity.ok(Map.of("item", Map.of("id", id)));
    }

    // PATCH /api/route/reviews/{id}
    @PatchMapping("/{id}")
    public ResponseEntity<?> update(@PathVariable long id,
                                    @RequestBody UpdateReq req,
                                    HttpServletRequest request) {
        String token = JwtProvider.extractToken(request);
        String userId = JwtProvider.getUserIdFromToken(token);
        if (userId == null) {
            return ResponseEntity.status(401).body(Map.of("error", "unauthorized"));
        }

        boolean ok = reviewService.update(id, userId, req.rating, req.text); // UPDATED_AT은 SQL에서 SYSTIMESTAMP로 갱신
        return ok
                ? ResponseEntity.ok(Map.of("ok", true))
                : ResponseEntity.status(403).body(Map.of("ok", false));
    }

    // DELETE /api/route/reviews/{id}
    @DeleteMapping("/{id}")
    public ResponseEntity<?> delete(@PathVariable long id, HttpServletRequest request) {
        String token = JwtProvider.extractToken(request);
        String userId = JwtProvider.getUserIdFromToken(token);
        if (userId == null) {
            return ResponseEntity.status(401).body(Map.of("error", "unauthorized"));
        }

        boolean ok = reviewService.delete(id, userId);
        return ok
                ? ResponseEntity.ok(Map.of("ok", true))
                : ResponseEntity.status(403).body(Map.of("ok", false));
    }

    /* ====== DTOs ====== */
    public static class CreateReq {
        public String key;     // reviewKey (예: "oil:UNI" / "ev:SID|SID")
        public double rating;  // 0.0 ~ 5.0
        public String text;
        // ⚠️ userName, clientId 제거
    }
    public static class UpdateReq {
        public double rating;
        public String text;
    }
}
