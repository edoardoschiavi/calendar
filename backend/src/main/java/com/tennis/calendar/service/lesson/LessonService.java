package com.tennis.calendar.service.lesson;

import com.tennis.calendar.model.Lesson;
import com.tennis.calendar.repository.LessonRepository;
import com.tennis.calendar.request.CreateLessonRequest;
import lombok.RequiredArgsConstructor;
import org.modelmapper.ModelMapper;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class LessonService implements ILessonService{

    private final LessonRepository lessonRepository;
    private final ModelMapper modelMapper;

    @Override
    public Lesson createLesson(CreateLessonRequest request) {
        return null;
    }

    @Override
    public void confirmLesson(Long lessonId) {

    }

    @Override
    public void deleteLesson(Long lessonId) {

    }
}
