package com.smarthire.controller;

import com.smarthire.dto.InterestRequest;
import com.smarthire.entity.Candidate;
import com.smarthire.service.CandidateService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/candidates")
@RequiredArgsConstructor
public class CandidateController {

    private final CandidateService candidateService;

    @PostMapping("/interest")
    public ResponseEntity<Candidate> registerInterest(@RequestBody InterestRequest req) {
        return ResponseEntity.ok(candidateService.registerInterest(req));
    }

    @GetMapping
    public List<Candidate> getAll() {
        return candidateService.getAll();
    }

    @GetMapping("/jd/{jdId}")
    public List<Candidate> getByJd(@PathVariable Long jdId) {
        return candidateService.getByJd(jdId);
    }

    @GetMapping("/{id}")
    public ResponseEntity<Candidate> getById(@PathVariable Long id) {
        return candidateService.getById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @GetMapping("/check")
    public ResponseEntity<Map<String, Object>> checkInterest(
            @RequestParam String email,
            @RequestParam Long jdId) {
        return candidateService.findByEmailAndJd(email, jdId)
                .map(c -> {
                    Map<String, Object> result = new HashMap<>();
                    result.put("exists", true);
                    result.put("candidateId", c.getId());
                    result.put("isInterested", c.getIsInterested());
                    result.put("hasResume", c.getResumePath() != null);
                    result.put("matchScore", c.getMatchScore() != null ? c.getMatchScore() : 0);
                    return ResponseEntity.ok(result);
                })
                .orElseGet(() -> {
                    Map<String, Object> result = new HashMap<>();
                    result.put("exists", false);
                    return ResponseEntity.ok(result);
                });
    }
}
