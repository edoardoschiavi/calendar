package com.tennis.calendar.repository;

import com.tennis.calendar.model.Lesson;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface LessonRepository extends JpaRepository<Lesson, Long>  {
    @Query("SELECT l FROM Lesson l JOIN l.users u WHERE u.id = :userId")
    List<Lesson> findLessonsByUserId(@Param("userId") Long userId);
}
