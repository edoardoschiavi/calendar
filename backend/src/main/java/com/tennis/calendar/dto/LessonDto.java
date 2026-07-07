package com.tennis.calendar.dto;
import lombok.Data;

import java.util.Date;
import java.util.List;

@Data
public class LessonDto {

    private Long id;
    private Date startTime;
    private Date endTime;
    private String status;
    private List<UserDto> users;

}
