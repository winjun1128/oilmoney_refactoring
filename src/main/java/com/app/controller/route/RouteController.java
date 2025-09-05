package com.app.controller.route;

import java.util.Map;
import javax.servlet.http.HttpServletRequest;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import com.app.dto.route.RouteSaveRequest;
import com.app.service.route.RouteService;
import com.app.util.JwtProvider;

import lombok.extern.slf4j.Slf4j;

@RestController
@RequestMapping("/api/route/paths")
@Slf4j
public class RouteController {

    @Autowired
    RouteService routeService;

    // ✅ FavController와 동일한 방식: 문자열 userId 반환
    private String userId(HttpServletRequest request) {
        String token = JwtProvider.extractToken(request);
        if (token == null || token.isBlank()) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Missing token");
        }
        String uid = JwtProvider.getUserIdFromToken(token); // 만료/검증 실패시 null
        if (uid == null || uid.isBlank()) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Invalid or expired token");
        }
        return uid.trim();
    }

    @GetMapping
    public Map<String, Object> list(HttpServletRequest req) {
        var items = routeService.list(userId(req));  // ← String으로 전달
        return Map.of("items", items);
    }

    @PostMapping
    public Map<String, Object> create(@RequestBody RouteSaveRequest req, HttpServletRequest http) {
        Long id = routeService.save(userId(http), req); // ← String으로 전달
        return Map.of("id", id);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteById(@PathVariable String id, HttpServletRequest http) {
    	System.out.println("id:"+id);
        String userId = userId(http); // 문자열 userId 버전
        // 클라 임시 ID면 그냥 무시(204)
        if (id.startsWith("local:")) return ResponseEntity.noContent().build();

        long rid;
        try {
            rid = Long.parseLong(id);
        } catch (NumberFormatException e) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "id must be numeric");
        }
        int n = routeService.delete(userId, rid);
        log.info("delete userId={}, rid={}, result={}", userId, rid, n);
        return (n > 0) ? ResponseEntity.noContent().build() : ResponseEntity.notFound().build();
    }


    @DeleteMapping("/by-labels")
    public ResponseEntity<Void> deleteByLabels(
            @RequestParam("o") String originLabel,
            @RequestParam(value = "d", required = false) String destLabel,
            HttpServletRequest http) {
    	
    	System.out.print("!!!!");

        int n = routeService.deleteByLabels(userId(http), originLabel, destLabel); // ← String
        return (n > 0) ? ResponseEntity.noContent().build() : ResponseEntity.notFound().build();
    }
}
