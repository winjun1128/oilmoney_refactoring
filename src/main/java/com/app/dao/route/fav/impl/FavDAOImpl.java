package com.app.dao.route.fav.impl;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

import org.mybatis.spring.SqlSessionTemplate;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Repository;

import com.app.dao.route.fav.FavDAO;
import com.app.dto.route.Fav;

@Repository
public class FavDAOImpl implements FavDAO {

	@Autowired
	SqlSessionTemplate sqlSessionTemplate;

	@Override
	public List<Fav> findByUserId(String userId) {
		
		return sqlSessionTemplate.selectList("fav_mapper.findByUserId",userId);
	}

	@Override
	public int exists(String userId, String favKey) {
		Map<String,Object> p = new HashMap<>();
	    p.put("userId", userId);
	    p.put("favKey", favKey);
		return sqlSessionTemplate.selectOne("fav_mapper.exists",p);
	}

	@Override
	public int insert(Fav fav) {
		return sqlSessionTemplate.insert("fav_mapper.insert",fav);
	}

	@Override
	public int upsert(Fav fav) {
		
		return sqlSessionTemplate.insert("fav_mapper.upsert",fav);
	}

	@Override
	public int delete(String userId, String favKey) {
		Map<String,Object> p = new HashMap<>();
	    p.put("userId", userId);
	    p.put("favKey", favKey);
		return sqlSessionTemplate.delete("fav_mapper.delete",p);
	}
	
	
}
