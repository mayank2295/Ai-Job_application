package com.smarthire.controller;

import com.smarthire.entity.JobDescription;
import com.smarthire.service.JobDescriptionService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/jds")
@RequiredArgsConstructor
public class JobDescriptionController {

    private final JobDescriptionService jdService;

    @GetMapping
    public List<JobDescription> getActive() {
        return jdService.getAllActive();
    }

    @GetMapping("/all")
    public List<JobDescription> getAll() {
        return jdService.getAll();
    }

    @GetMapping("/{id}")
    public ResponseEntity<JobDescription> getById(@PathVariable Long id) {
        return jdService.getById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @PostMapping
    public ResponseEntity<JobDescription> create(@RequestBody JobDescription jd) {
        return ResponseEntity.ok(jdService.save(jd));
    }

    @PutMapping("/{id}")
    public ResponseEntity<JobDescription> update(@PathVariable Long id, @RequestBody JobDescription jd) {
        return jdService.getById(id).map(existing -> {
            jd.setId(id);
            jd.setCreatedAt(existing.getCreatedAt());
            return ResponseEntity.ok(jdService.save(jd));
        }).orElse(ResponseEntity.notFound().build());
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deactivate(@PathVariable Long id) {
        jdService.deactivate(id);
        return ResponseEntity.ok().build();
    }
}
