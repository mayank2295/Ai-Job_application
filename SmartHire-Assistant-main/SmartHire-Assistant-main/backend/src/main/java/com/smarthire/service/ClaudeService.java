package com.smarthire.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.smarthire.entity.ChatLog;
import com.smarthire.entity.JobDescription;
import com.smarthire.repository.ChatLogRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClient;

import java.util.*;

@Service
@RequiredArgsConstructor
@Slf4j
public class ClaudeService {

    private final ChatLogRepository chatLogRepository;
    private final ObjectMapper objectMapper;

    @Value("${claude.api.key}")
    private String apiKey;

    @Value("${claude.api.url}")
    private String apiUrl;

    @Value("${claude.model}")
    private String model;

    private final RestClient restClient = RestClient.create();

    public String chat(String sessionId, JobDescription jd, String userMessage, String userName) {
        if (!isApiKeyConfigured()) {
            return "Demo mode: Claude API key not configured. Add CLAUDE_API_KEY to your .env file to enable AI responses.";
        }

        List<ChatLog> history = chatLogRepository.findTop20BySessionIdOrderByCreatedAtAsc(sessionId);
        String systemPrompt = buildSystemPrompt(jd);
        List<Map<String, String>> messages = buildMessages(history, userMessage);

        try {
            String responseText = callClaudeApi(systemPrompt, messages);
            saveChatLogs(sessionId, jd.getId(), userMessage, responseText);
            return responseText;
        } catch (Exception e) {
            log.error("Claude API call failed: {}", e.getMessage());
            saveChatLogs(sessionId, jd.getId(), userMessage,
                    "I'm having trouble connecting right now. Please try again in a moment.");
            return "I'm having trouble connecting right now. Please try again in a moment.";
        }
    }

    private String buildSystemPrompt(JobDescription jd) {
        return """
                You are SmartHire Assistant, an AI-powered recruiting chatbot for Wissen Technology.
                You are helping candidates interested in the following position:

                --- JOB DESCRIPTION ---
                %s
                --- END JOB DESCRIPTION ---

                About Wissen Technology:
                Wissen Technology is a global technology company founded in 2015, with 2000+ employees
                across US, UK, UAE, India, and Australia. They deliver niche, custom-built products
                that solve complex business challenges across industries.

                Your responsibilities:
                1. Answer questions about the role, responsibilities, required skills, and work culture based on the JD above.
                2. Answer general career and course recommendation questions related to this role.
                3. Be professional, concise, and encouraging.
                4. For questions about specific salary numbers or internal HR processes not in the JD, say:
                   "I don't have that specific detail — I'll connect you with our recruiter team."
                5. Encourage qualified candidates to click "I'm Interested" and upload their resume for a match score.
                6. Keep responses focused and avoid unnecessary verbosity.
                """.formatted(jd.getContent());
    }

    private List<Map<String, String>> buildMessages(List<ChatLog> history, String userMessage) {
        List<Map<String, String>> messages = new ArrayList<>();
        for (ChatLog log : history) {
            messages.add(Map.of("role", log.getRole(), "content", log.getMessage()));
        }
        messages.add(Map.of("role", "user", "content", userMessage));
        return messages;
    }

    private String callClaudeApi(String systemPrompt, List<Map<String, String>> messages) throws Exception {
        Map<String, Object> requestBody = new HashMap<>();
        requestBody.put("model", model);
        requestBody.put("max_tokens", 1024);
        requestBody.put("system", systemPrompt);
        requestBody.put("messages", messages);

        String rawResponse = restClient.post()
                .uri(apiUrl)
                .header("x-api-key", apiKey)
                .header("anthropic-version", "2023-06-01")
                .contentType(MediaType.APPLICATION_JSON)
                .body(requestBody)
                .retrieve()
                .body(String.class);

        JsonNode root = objectMapper.readTree(rawResponse);
        return root.path("content").get(0).path("text").asText();
    }

    private void saveChatLogs(String sessionId, Long jdId, String userMessage, String assistantMessage) {
        chatLogRepository.save(ChatLog.builder()
                .sessionId(sessionId)
                .jobDescriptionId(jdId)
                .role("user")
                .message(userMessage)
                .build());

        chatLogRepository.save(ChatLog.builder()
                .sessionId(sessionId)
                .jobDescriptionId(jdId)
                .role("assistant")
                .message(assistantMessage)
                .build());
    }

    private boolean isApiKeyConfigured() {
        return apiKey != null && !apiKey.isBlank() && !apiKey.equals("your_key_here");
    }
}
