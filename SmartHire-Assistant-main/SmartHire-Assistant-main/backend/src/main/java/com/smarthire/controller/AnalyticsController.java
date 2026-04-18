package com.smarthire.controller;

import com.smarthire.dto.AnalyticsDto;
import com.smarthire.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/analytics")
@RequiredArgsConstructor
public class AnalyticsController {

    private final CandidateRepository candidateRepository;
    private final JobDescriptionRepository jdRepository;
    private final AppUserRepository userRepository;
    private final ChatLogRepository chatLogRepository;

    @GetMapping("/summary")
    public AnalyticsDto getSummary() {
        Double avgMatch = candidateRepository.findAverageMatchScore();
        return AnalyticsDto.builder()
                .totalCandidates(candidateRepository.count())
                .interestedCandidates(candidateRepository.countByIsInterestedTrue())
                .activeJobs(jdRepository.findByIsActiveTrueOrderByCreatedAtDesc().size())
                .totalUsers(userRepository.count())
                .averageMatchScore(avgMatch != null ? Math.round(avgMatch * 10.0) / 10.0 : 0.0)
                .totalChatMessages(chatLogRepository.count())
                .build();
    }
}
