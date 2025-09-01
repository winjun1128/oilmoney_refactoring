package com.app.service.route.impl;

import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.app.dao.route.fav.FavDAO;
import com.app.dto.route.Fav;
import com.app.service.route.FavService;

@Service
public class FavServiceImpl implements FavService{
	
	@Autowired
	FavDAO favDAO;

	@Override
	public List<Fav> list(String userId) {
		
		return favDAO.findByUserId(userId);
	}

	@Override
	@Transactional
	public void addIfAbsent(String userId, String favKey, String type) {
		Fav f = new Fav();
	    f.setUserId(userId);
	    f.setFavKey(favKey);
	    f.setType(type);
	    // MERGE 사용: 중복이면 아무 작업 안 함
	    favDAO.upsert(f);
		
		
	}

	@Override
	@Transactional
	public void remove(String userId, String favKey) {
		favDAO.delete(userId, favKey);
	}

}
