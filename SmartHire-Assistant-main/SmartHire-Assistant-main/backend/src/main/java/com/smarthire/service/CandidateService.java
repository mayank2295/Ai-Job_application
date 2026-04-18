package com.smarthire.service;

import com.smarthire.dto.InterestRequest;
import com.smarthire.entity.Candidate;
import com.smarthire.repository.CandidateRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;

@Service
@RequiredArgsConstructor
public class CandidateService {

    private final CandidateRepository candidateRepository;

    public Candidate registerInterest(InterestRequest req) {
        Optional<Candidate> existing = candidateRepository
                .findByEmailAndJobDescriptionId(req.getEmail(), req.getJobDescriptionId());

        if (existing.isPresent()) {
            Candidate c = existing.get();
            c.setIsInterested(true);
            return candidateRepository.save(c);
        }

        return candidateRepository.save(Candidate.builder()
                .name(req.getName())
                .email(req.getEmail())
                .phone(req.getPhone())
                .jobDescriptionId(req.getJobDescriptionId())
                .isInterested(true)
                .build());
    }

    public List<Candidate> getAll() {
        return candidateRepository.findAllByOrderByMatchScoreDesc();
    }

    public List<Candidate> getByJd(Long jdId) {
        return candidateRepository.findByJobDescriptionIdOrderByMatchScoreDesc(jdId);
    }

    public Optional<Candidate> getById(Long id) {
        return candidateRepository.findById(id);
    }

    public Optional<Candidate> findByEmailAndJd(String email, Long jdId) {
        return candidateRepository.findByEmailAndJobDescriptionId(email, jdId);
    }

    public Candidate save(Candidate candidate) {
        return candidateRepository.save(candidate);
    }
}
