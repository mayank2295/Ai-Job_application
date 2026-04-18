package com.smarthire.repository;

import com.smarthire.entity.ChatLog;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ChatLogRepository extends JpaRepository<ChatLog, Long> {
    List<ChatLog> findBySessionIdOrderByCreatedAtAsc(String sessionId);
    List<ChatLog> findTop20BySessionIdOrderByCreatedAtAsc(String sessionId);
    List<ChatLog> findByCandidateIdOrderByCreatedAtAsc(Long candidateId);
    long countBySessionId(String sessionId);
}
