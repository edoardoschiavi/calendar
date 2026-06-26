package com.tennis.calendar.repository;

import com.tennis.calendar.model.Lesson;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface LessonRepository extends JpaRepository<Lesson, Long>  {

    Lesson findByLessonId(Long lessonId);
    List<Lesson> findLessonsByUserId(Long userId);

}
