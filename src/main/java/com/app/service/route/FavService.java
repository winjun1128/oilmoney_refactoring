package com.app.service.route;

import java.util.List;

import com.app.dto.route.Fav;

public interface FavService {
	  List<Fav> list(String userId);
	  void addIfAbsent(String userId, String favKey, String type); // idempotent
	  void remove(String userId, String favKey);
}
