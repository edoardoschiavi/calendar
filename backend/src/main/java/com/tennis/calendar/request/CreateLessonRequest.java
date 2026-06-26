package com.tennis.calendar.request;

import com.tennis.calendar.enums.LessonStatus;
import com.tennis.calendar.model.User;
import lombok.Data;

import java.util.Date;
import java.util.List;

@Data
public class CreateLessonRequest {

    private Date day;
    private String hour;
    private LessonStatus status = LessonStatus.DRAFT;
    private List<User> users;

}
