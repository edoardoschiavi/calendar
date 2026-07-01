package com.tennis.calendar.service.lesson;

import com.tennis.calendar.dto.LessonDto;
import com.tennis.calendar.model.Lesson;
import com.tennis.calendar.model.User;
import com.tennis.calendar.request.CreateLessonRequest;

import java.util.Date;
import java.util.List;

public interface ILessonService {

    Lesson createLesson(CreateLessonRequest request);
    void confirmLesson(Long lessonId);
    void deleteLesson(Long lessonId);
    Lesson getLessonById(Long lessonId);

    LessonDto convertLessonToDto(Lesson lesson);

    List<LessonDto> getLessonsInPeriod(Date start, Date end);
}
