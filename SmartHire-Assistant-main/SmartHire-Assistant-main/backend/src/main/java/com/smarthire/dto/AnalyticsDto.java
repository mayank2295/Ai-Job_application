package com.smarthire.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data @Builder @NoArgsConstructor @AllArgsConstructor
public class AnalyticsDto {
    private long totalCandidates;
    private long interestedCandidates;
    private long activeJobs;
    private long totalUsers;
    private Double averageMatchScore;
    private long totalChatMessages;
}
