package com.app.controller.route;

import com.app.service.route.ReviewService;
import com.app.util.JwtProvider;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import javax.servlet.http.HttpServletRequest;
import java.util.*;
import java.util.stream.Collectors;

@RestController
@RequestMapping(value = "/api/route/reviews", produces = MediaType.APPLICATION_JSON_VALUE)
public class RouteReviewController {

    @Autowired
    ReviewService reviewService;

    // GET /api/route/reviews?key=...&page=1&size=5&clientId=...
    @GetMapping
    public ResponseEntity<?> list(
            @RequestParam("key") String key,
            @RequestParam(value = "page", defaultValue = "1") int page,
            @RequestParam(value = "size", defaultValue = "5") int size,
            @RequestParam(value = "clientId", required = false) String clientId, // (선택) 비로그인 식별자 로깅 용도
            HttpServletRequest request
    ) {
        String token = JwtProvider.extractToken(request);
        String userIdOrNull = JwtProvider.getUserIdFromToken(token); // 로그인 안 했으면 null

        ReviewService.PagedResult res = reviewService.list(key, userIdOrNull, page, size);

        // 프론트 포맷에 맞춰 가공 (createdAt => ts, mine은 SQL에서 계산해둠)
        List<Map<String, Object>> items = res.items.stream().map(r -> {
            Map<String, Object> m = new HashMap<>();
            m.put("id", r.getId());
            m.put("user", r.getUserName() != null ? r.getUserName() : "익명");
            m.put("rating", r.getRating());
            m.put("text", r.getText());
            m.put("ts", r.getCreatedAt() != null
                    ? r.getCreatedAt().toString().replace('T', ' ').substring(0, 16)
                    : "");
            // ★ 리뷰 작성자와 JWT의 sub 비교로 mine 판정
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

        // 표시 이름은 요청 바디에서 받되, 없으면 '익명'
        String userName = (req.userName != null && !req.userName.trim().isEmpty())
                ? req.userName
                : "익명";

        long id = reviewService.create(req.key, userId, userName, req.clientId, req.rating, req.text);
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

        boolean ok = reviewService.update(id, userId, req.rating, req.text);
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
        public String key;      // reviewKey (예: "oil:UNI" / "ev:SID|SID")
        public double rating;   // 0.0 ~ 5.0
        public String text;
        public String clientId; // 기록 용 (비로그인 클라 식별)
        public String userName; // 선택: 프론트 표기용(없으면 '익명')
    }
    public static class UpdateReq {
        public double rating;
        public String text;
    }
}
