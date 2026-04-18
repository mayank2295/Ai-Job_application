package com.smarthire.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

@Entity
@Table(name = "candidates")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class Candidate {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private Long userId;

    @Column(nullable = false)
    private String name;

    @Column(nullable = false)
    private String email;

    private String phone;

    private String resumePath;

    @Column(columnDefinition = "TEXT")
    private String resumeText;

    @Column(columnDefinition = "TEXT")
    private String extractedSkills; // comma-separated, from resume

    private Double experienceYears;

    private Double matchScore;

    @Column(columnDefinition = "TEXT")
    private String matchedSkillsJson; // JSON array

    @Column(columnDefinition = "TEXT")
    private String missingSkillsJson; // JSON array

    @Column(columnDefinition = "TEXT")
    private String matchExplanation;

    private Long jobDescriptionId;

    @Column(nullable = false)
    private Boolean isInterested;

    @Column(updatable = false)
    private LocalDateTime createdAt;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        if (isInterested == null) isInterested = false;
    }
}
