package com.app.controller.route;

import com.app.dto.route.Fav;
import com.app.dto.route.FavReq;
import com.app.service.route.FavService;
import com.app.util.JwtProvider;
import javax.servlet.http.HttpServletRequest;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.*;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/route")
public class FavController {

 @Autowired
 FavService favService;

 @GetMapping("/favs")
 public Map<String, Object> getFavs(HttpServletRequest request) {
     String token  = JwtProvider.extractToken(request);
     String userId = JwtProvider.getUserIdFromToken(token);

     // Java 8: 빈 리스트
     List<Map<String, Object>> items = java.util.Collections.emptyList();

     if (userId != null) {
         List<Fav> rows = favService.list(userId);
         items = rows.stream()
             .map(r -> {
                 Map<String, Object> m = new java.util.HashMap<>();
                 m.put("key",  r.getFavKey());
                 m.put("mode", r.getType());
                 return m;
             })
             .collect(java.util.stream.Collectors.toList());
     }

     // Java 8: 응답 맵
     Map<String, Object> resp = new java.util.HashMap<>();
     resp.put("items", items);
     return resp;
 }


  @PostMapping("/favs")
  public ResponseEntity<?> add(@RequestBody FavReq req, HttpServletRequest request) {
    String token = JwtProvider.extractToken(request);
    String userId = JwtProvider.getUserIdFromToken(token);
    if (userId == null) return ResponseEntity.status(401).body(Map.of("error","unauthorized"));

    if (req == null || req.key == null || req.mode == null) {
      return ResponseEntity.badRequest().body(Map.of("error","key/mode required"));
    }
    favService.addIfAbsent(userId, req.key, req.mode);
    return ResponseEntity.ok(Map.of("key", req.key, "mode", req.mode));
  }

  @DeleteMapping("/favs/{key}")
  public ResponseEntity<?> remove(@PathVariable String key, HttpServletRequest request) {
    String token = JwtProvider.extractToken(request);
    String userId = JwtProvider.getUserIdFromToken(token);
    if (userId == null) return ResponseEntity.status(401).body(Map.of("error","unauthorized"));

    favService.remove(userId, key);
    return ResponseEntity.noContent().build();
  }
}
