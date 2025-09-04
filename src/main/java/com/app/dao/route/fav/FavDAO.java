package com.app.dao.route.fav;

import java.util.List;

import com.app.dto.route.Fav;

public interface FavDAO {
	  List<Fav> findByUserId(String userId);
	  int exists(String userId, String favKey);
	  int insert(Fav fav);
	  int upsert(Fav fav);
	  int delete(String userId, String favKey);
}
