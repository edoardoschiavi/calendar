package com.tennis.calendar.model;

import com.tennis.calendar.enums.LessonStatus;
import jakarta.persistence.*;
import lombok.Data;

import java.util.ArrayList;
import java.util.Date;
import java.util.List;

@Data
@Entity
public class Lesson {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private Date startTime;
    private Date endTime;

    @Enumerated(EnumType.STRING)
    private LessonStatus status;

    @ManyToMany(mappedBy = "userLessons")
    private List<User> users = new ArrayList<>();

}
