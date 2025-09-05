package com.app.service.route.impl;

import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.dao.DuplicateKeyException;  // ✅ 반드시 임포트
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.app.dao.route.route.RouteDAO;
import com.app.dto.route.Route;
import com.app.dto.route.RouteSaveRequest;
import com.app.service.route.RouteService;

@Service
@Transactional
public class RouteServiceImpl implements RouteService {

    @Autowired
    RouteDAO routeDAO;

    @Override
    @Transactional(readOnly = true)
    public List<Route> list(String userId) {
        return routeDAO.findByUserId(userId);
    }

    @Override
    public Long save(String userId, RouteSaveRequest req) {
        // 1) 입력 정규화
        final String origin = safe(req.getOriginLabel());
        final String dest   = emptyToNull(trim(req.getDestLabel()));

        // 2) 사전 조회(공백/NULL 무시 규칙은 Mapper에서 TRIM+NVL로 처리)
        Long existed = routeDAO.findIdByLabels(userId, origin, dest);
        if (existed != null) return existed;

        // 3) 없으면 INSERT
        Route entity = toEntity(userId, req);  // ✅ 아래에 구현
        try {
            routeDAO.insert(entity); // 일반적으로 int 반환(영향 행 수)
        } catch (DuplicateKeyException e) {
            // 유니크 인덱스가 있으면 동시성에서 올 수 있음 → 다시 조회해 반환
            Long id = routeDAO.findIdByLabels(userId, origin, dest);
            if (id != null) return id;
            throw e;
        }

        // 4) selectKey로 채워진 PK 반환
        return entity.getRouteId();
    }

    @Override
    public int delete(String userId, Long routeId) {
        return routeDAO.deleteByIdAndUserId(routeId, userId);
    }

    @Override
    public int deleteByLabels(String userId, String originLabel, String destLabel) {
        // destLabel은 "" → null로 넘김 (Mapper에서 NVL(TRIM(...),'') 비교)
        return routeDAO.deleteByLabels(
            userId,
            safe(originLabel),
            emptyToNull(trim(destLabel))
        );
    }

    // ---------- helpers ----------
    private static String safe(String s) {
        String t = trim(s);
        if (t == null || t.isEmpty()) throw new IllegalArgumentException("originLabel is required");
        return t;
    }
    private static String trim(String s) { return s == null ? null : s.trim(); }
    private static String emptyToNull(String s) { return (s == null || s.isEmpty()) ? null : s; }

    // ✅ 요청 → 엔티티 매핑 (빈 도착지는 null 처리 + 좌표도 null)
    private static Route toEntity(String userId, RouteSaveRequest req) {
        Route r = new Route();
        r.setUserId(userId);

        r.setOriginLabel(trim(req.getOriginLabel()));
        r.setOriginLon(req.getOriginLon());
        r.setOriginLat(req.getOriginLat());

        String dlab = emptyToNull(trim(req.getDestLabel()));
        r.setDestLabel(dlab);
        if (dlab == null) {
            r.setDestLon(null);
            r.setDestLat(null);
        } else {
            r.setDestLon(req.getDestLon());
            r.setDestLat(req.getDestLat());
        }
        return r;
    }
}
