package com.smarthire.controller;

import com.smarthire.dto.ChatRequest;
import com.smarthire.dto.ChatResponse;
import com.smarthire.entity.ChatLog;
import com.smarthire.entity.JobDescription;
import com.smarthire.repository.ChatLogRepository;
import com.smarthire.service.ClaudeService;
import com.smarthire.service.JobDescriptionService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/chat")
@RequiredArgsConstructor
public class ChatController {

    private final ClaudeService claudeService;
    private final JobDescriptionService jdService;
    private final ChatLogRepository chatLogRepository;

    @PostMapping
    public ResponseEntity<ChatResponse> chat(@RequestBody ChatRequest req) {
        JobDescription jd = jdService.getById(req.getJdId())
                .orElseThrow(() -> new IllegalArgumentException("JD not found: " + req.getJdId()));

        String response = claudeService.chat(
                req.getSessionId(),
                jd,
                req.getMessage(),
                req.getUserName()
        );

        return ResponseEntity.ok(ChatResponse.builder()
                .message(response)
                .sessionId(req.getSessionId())
                .success(true)
                .build());
    }

    @GetMapping("/history/{sessionId}")
    public List<ChatLog> getHistory(@PathVariable String sessionId) {
        return chatLogRepository.findBySessionIdOrderByCreatedAtAsc(sessionId);
    }
}
