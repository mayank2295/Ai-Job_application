package com.smarthire.dto;

import lombok.Data;

@Data
public class InterestRequest {
    private String name;
    private String email;
    private String phone;
    private Long jobDescriptionId;
    private String sessionId;
}
