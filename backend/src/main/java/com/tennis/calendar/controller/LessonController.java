package com.tennis.calendar.controller;

import com.tennis.calendar.dto.LessonDto;
import com.tennis.calendar.model.Lesson;
import com.tennis.calendar.repository.ApiResponse;
import com.tennis.calendar.request.CreateLessonRequest;
import com.tennis.calendar.service.lesson.ILessonService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequiredArgsConstructor
@RequestMapping("/lessons")
public class LessonController {

    private final ILessonService lessonService;

    @GetMapping("/{lessonId}/lesson")
    public ResponseEntity<ApiResponse> getLessonById(@PathVariable Long lessonId) {
        Lesson lesson = lessonService.getLessonById(lessonId);
        LessonDto convertedLesson = lessonService.convertLessonToDto(lesson);
        return ResponseEntity.ok(new ApiResponse("Lesson found!", convertedLesson));
    };

    @PostMapping("/add")
    public ResponseEntity<ApiResponse> createLesson(@RequestBody CreateLessonRequest request) {
        Lesson lesson = lessonService.createLesson(request);
        LessonDto convertedLesson = lessonService.convertLessonToDto(lesson);
        return ResponseEntity.ok(new ApiResponse("Success!", convertedLesson));
    };

    @PutMapping("/{lessonId}/confirm")
    public ResponseEntity<ApiResponse> confirmLesson(@PathVariable Long lessonId) {
        lessonService.confirmLesson(lessonId);
        return ResponseEntity.ok(new ApiResponse("Lesson confirmed!", "OK"));
    };
}
