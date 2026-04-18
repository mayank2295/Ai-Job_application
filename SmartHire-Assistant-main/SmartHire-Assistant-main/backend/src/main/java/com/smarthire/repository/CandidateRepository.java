package com.smarthire.repository;

import com.smarthire.entity.Candidate;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface CandidateRepository extends JpaRepository<Candidate, Long> {
    List<Candidate> findByJobDescriptionIdOrderByMatchScoreDesc(Long jdId);
    List<Candidate> findAllByOrderByMatchScoreDesc();
    Optional<Candidate> findByEmailAndJobDescriptionId(String email, Long jdId);

    @Query("SELECT AVG(c.matchScore) FROM Candidate c WHERE c.matchScore IS NOT NULL")
    Double findAverageMatchScore();

    long countByIsInterestedTrue();
}
