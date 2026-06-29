package com.tennis.calendar.dto;

import com.tennis.calendar.model.User;
import lombok.Data;

import java.util.Date;
import java.util.List;

@Data
public class LessonDto {

    private Date day;
    private String hour;
    private String status;
    private List<User> users;

}
