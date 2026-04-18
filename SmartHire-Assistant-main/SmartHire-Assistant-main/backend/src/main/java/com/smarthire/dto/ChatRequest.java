package com.smarthire.dto;

import lombok.Data;

@Data
public class ChatRequest {
    private Long jdId;
    private String sessionId;
    private String message;
    private String userName;
}
