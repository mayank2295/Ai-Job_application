package com.smarthire.repository;

import com.smarthire.entity.JobDescription;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface JobDescriptionRepository extends JpaRepository<JobDescription, Long> {
    List<JobDescription> findByIsActiveTrueOrderByCreatedAtDesc();
    List<JobDescription> findAllByOrderByCreatedAtDesc();
}
