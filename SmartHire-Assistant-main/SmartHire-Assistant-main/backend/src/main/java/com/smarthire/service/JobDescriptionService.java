package com.smarthire.service;

import com.smarthire.entity.JobDescription;
import com.smarthire.repository.JobDescriptionRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;

@Service
@RequiredArgsConstructor
public class JobDescriptionService {

    private final JobDescriptionRepository jdRepository;

    public List<JobDescription> getAllActive() {
        return jdRepository.findByIsActiveTrueOrderByCreatedAtDesc();
    }

    public List<JobDescription> getAll() {
        return jdRepository.findAllByOrderByCreatedAtDesc();
    }

    public Optional<JobDescription> getById(Long id) {
        return jdRepository.findById(id);
    }

    public JobDescription save(JobDescription jd) {
        return jdRepository.save(jd);
    }

    public void deactivate(Long id) {
        jdRepository.findById(id).ifPresent(jd -> {
            jd.setIsActive(false);
            jdRepository.save(jd);
        });
    }

    public void delete(Long id) {
        jdRepository.deleteById(id);
    }
}
