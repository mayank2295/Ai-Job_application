package com.smarthire.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data @Builder @NoArgsConstructor @AllArgsConstructor
public class MatchResultDto {
    private Double matchPercentage;
    private Double skillsScore;
    private Double experienceScore;
    private Double educationScore;
    private List<String> matchedSkills;
    private List<String> missingSkills;
    private String explanation;
    private Long candidateId;
}
