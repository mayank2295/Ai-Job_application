package com.smarthire.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.smarthire.dto.MatchResultDto;
import com.smarthire.entity.Candidate;
import com.smarthire.entity.JobDescription;
import com.smarthire.repository.CandidateRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.ByteArrayResource;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.util.LinkedMultiValueMap;
import org.springframework.util.MultiValueMap;
import org.springframework.web.client.RestClient;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.*;

@Service
@RequiredArgsConstructor
@Slf4j
public class ResumeService {

    private final CandidateRepository candidateRepository;
    private final ObjectMapper objectMapper;

    @Value("${python.service.url}")
    private String pythonServiceUrl;

    @Value("${app.upload.dir}")
    private String uploadDir;

    private final RestClient restClient = RestClient.create();

    public MatchResultDto processResume(MultipartFile file, Long candidateId, JobDescription jd) throws IOException {
        String savedPath = saveFile(file, candidateId);

        Map<String, Object> parsedResume = callPythonParser(file);
        MatchResultDto matchResult = calculateMatch(parsedResume, jd);

        updateCandidate(candidateId, savedPath, parsedResume, matchResult);

        return matchResult;
    }

    private String saveFile(MultipartFile file, Long candidateId) throws IOException {
        Path dir = Paths.get(uploadDir);
        if (!Files.exists(dir)) Files.createDirectories(dir);

        String filename = candidateId + "_" + System.currentTimeMillis() + "_" + file.getOriginalFilename();
        Path dest = dir.resolve(filename);
        Files.write(dest, file.getBytes());
        return dest.toString();
    }

    @SuppressWarnings("unchecked")
    private Map<String, Object> callPythonParser(MultipartFile file) {
        try {
            MultiValueMap<String, Object> body = new LinkedMultiValueMap<>();
            body.add("file", new ByteArrayResource(file.getBytes()) {
                @Override
                public String getFilename() {
                    return file.getOriginalFilename();
                }
            });

            String response = restClient.post()
                    .uri(pythonServiceUrl + "/parse-resume")
                    .contentType(MediaType.MULTIPART_FORM_DATA)
                    .body(body)
                    .retrieve()
                    .body(String.class);

            return objectMapper.readValue(response, Map.class);
        } catch (Exception e) {
            log.warn("Python service unavailable, using fallback parser: {}", e.getMessage());
            return fallbackParse(file);
        }
    }

    private MatchResultDto calculateMatch(Map<String, Object> parsed, JobDescription jd) {
        try {
            List<String> candidateSkills = getSkillsList(parsed);
            double experienceYears = getExperienceYears(parsed);
            List<String> jdSkills = Arrays.stream(jd.getSkills().split(","))
                    .map(String::trim).filter(s -> !s.isEmpty()).toList();

            Map<String, Object> matchRequest = new HashMap<>();
            matchRequest.put("jdSkills", jdSkills);
            matchRequest.put("candidateSkills", candidateSkills);
            matchRequest.put("jdExperienceMin", jd.getExperienceMin() != null ? jd.getExperienceMin() : 0);
            matchRequest.put("jdExperienceMax", jd.getExperienceMax() != null ? jd.getExperienceMax() : 99);
            matchRequest.put("candidateExperience", experienceYears);

            String response = restClient.post()
                    .uri(pythonServiceUrl + "/calculate-match")
                    .contentType(MediaType.APPLICATION_JSON)
                    .body(matchRequest)
                    .retrieve()
                    .body(String.class);

            return parseMatchResult(response);
        } catch (Exception e) {
            log.warn("Python match service unavailable, using Java fallback: {}", e.getMessage());
            return fallbackMatch(parsed, jd);
        }
    }

    @SuppressWarnings("unchecked")
    private MatchResultDto parseMatchResult(String json) throws Exception {
        Map<String, Object> result = objectMapper.readValue(json, Map.class);
        return MatchResultDto.builder()
                .matchPercentage(((Number) result.getOrDefault("match_percentage", 0)).doubleValue())
                .skillsScore(((Number) result.getOrDefault("skills_score", 0)).doubleValue())
                .experienceScore(((Number) result.getOrDefault("experience_score", 0)).doubleValue())
                .educationScore(((Number) result.getOrDefault("education_score", 0)).doubleValue())
                .matchedSkills((List<String>) result.getOrDefault("matched_skills", List.of()))
                .missingSkills((List<String>) result.getOrDefault("missing_skills", List.of()))
                .explanation((String) result.getOrDefault("explanation", ""))
                .build();
    }

    private void updateCandidate(Long candidateId, String resumePath,
                                  Map<String, Object> parsed, MatchResultDto match) {
        candidateRepository.findById(candidateId).ifPresent(candidate -> {
            candidate.setResumePath(resumePath);
            candidate.setExtractedSkills(String.join(",", getSkillsList(parsed)));
            candidate.setExperienceYears(getExperienceYears(parsed));
            candidate.setMatchScore(match.getMatchPercentage());
            candidate.setMatchedSkillsJson(listToJson(match.getMatchedSkills()));
            candidate.setMissingSkillsJson(listToJson(match.getMissingSkills()));
            candidate.setMatchExplanation(match.getExplanation());
            candidateRepository.save(candidate);
        });
    }

    // Fallback parser for when Python service is unavailable
    @SuppressWarnings("unchecked")
    private Map<String, Object> fallbackParse(MultipartFile file) {
        Map<String, Object> result = new HashMap<>();
        result.put("skills", List.of());
        result.put("experience_years", 0.0);
        result.put("education", "Unknown");
        result.put("raw_text", "");
        return result;
    }

    private MatchResultDto fallbackMatch(Map<String, Object> parsed, JobDescription jd) {
        List<String> candidateSkills = getSkillsList(parsed);
        double experience = getExperienceYears(parsed);
        List<String> jdSkills = Arrays.stream(jd.getSkills().split(","))
                .map(s -> s.trim().toLowerCase()).filter(s -> !s.isEmpty()).toList();

        List<String> matched = candidateSkills.stream()
                .map(String::toLowerCase)
                .filter(jdSkills::contains)
                .toList();
        List<String> missing = jdSkills.stream()
                .filter(s -> !matched.contains(s))
                .toList();

        double skillsScore = jdSkills.isEmpty() ? 50 : (matched.size() * 1.0 / jdSkills.size()) * 50;
        int expMin = jd.getExperienceMin() != null ? jd.getExperienceMin() : 0;
        double expScore = experience >= expMin ? 30 : (experience / Math.max(expMin, 1)) * 30;
        double eduScore = 20;
        double total = Math.min(skillsScore + expScore + eduScore, 100);

        return MatchResultDto.builder()
                .matchPercentage(Math.round(total * 10.0) / 10.0)
                .skillsScore(Math.round(skillsScore * 10.0) / 10.0)
                .experienceScore(Math.round(expScore * 10.0) / 10.0)
                .educationScore(eduScore)
                .matchedSkills(matched)
                .missingSkills(missing)
                .explanation(String.format("Matched %d/%d skills. %.1f years experience vs %d+ required.",
                        matched.size(), jdSkills.size(), experience, expMin))
                .build();
    }

    @SuppressWarnings("unchecked")
    private List<String> getSkillsList(Map<String, Object> parsed) {
        Object skills = parsed.get("skills");
        if (skills instanceof List) return (List<String>) skills;
        return List.of();
    }

    private double getExperienceYears(Map<String, Object> parsed) {
        Object exp = parsed.get("experience_years");
        if (exp instanceof Number) return ((Number) exp).doubleValue();
        return 0.0;
    }

    private String listToJson(List<String> list) {
        if (list == null) return "[]";
        try {
            return objectMapper.writeValueAsString(list);
        } catch (Exception e) {
            return "[]";
        }
    }
}
