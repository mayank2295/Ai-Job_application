package com.smarthire.controller;

import com.smarthire.dto.MatchResultDto;
import com.smarthire.entity.JobDescription;
import com.smarthire.service.JobDescriptionService;
import com.smarthire.service.ResumeService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

@RestController
@RequestMapping("/api/resume")
@RequiredArgsConstructor
public class ResumeController {

    private final ResumeService resumeService;
    private final JobDescriptionService jdService;

    @PostMapping("/upload")
    public ResponseEntity<?> upload(
            @RequestParam("file") MultipartFile file,
            @RequestParam("candidateId") Long candidateId,
            @RequestParam("jdId") Long jdId) {

        if (file.isEmpty()) {
            return ResponseEntity.badRequest().body("File is empty");
        }

        String filename = file.getOriginalFilename();
        if (filename == null || !filename.toLowerCase().endsWith(".pdf")) {
            return ResponseEntity.badRequest().body("Only PDF files are supported");
        }

        JobDescription jd = jdService.getById(jdId)
                .orElseThrow(() -> new IllegalArgumentException("JD not found: " + jdId));

        try {
            MatchResultDto result = resumeService.processResume(file, candidateId, jd);
            result.setCandidateId(candidateId);
            return ResponseEntity.ok(result);
        } catch (Exception e) {
            return ResponseEntity.internalServerError()
                    .body("Failed to process resume: " + e.getMessage());
        }
    }
}
