package com.app.service.route;

public interface EvImportService {
	void importInfoSnapshot() throws Exception;       // 충전소/충전기 스냅샷 적재
	int  pollStatusIncrement(int periodMinutes) throws Exception; // 상태 증분 UPSERT
}
