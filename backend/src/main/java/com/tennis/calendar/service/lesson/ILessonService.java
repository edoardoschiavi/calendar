package com.tennis.calendar.service.lesson;

import com.tennis.calendar.model.Lesson;
import com.tennis.calendar.request.CreateLessonRequest;

public interface ILessonService {

    Lesson createLesson(CreateLessonRequest request);
    void confirmLesson(Long lessonId);
    void deleteLesson(Long lessonId);
}
