package com.tennis.calendar.service.lesson;

import com.tennis.calendar.dto.LessonDto;
import com.tennis.calendar.enums.LessonStatus;
import com.tennis.calendar.model.Lesson;
import com.tennis.calendar.model.User;
import com.tennis.calendar.repository.LessonRepository;
import com.tennis.calendar.repository.UserRepository;
import com.tennis.calendar.request.CreateLessonRequest;
import jakarta.persistence.EntityExistsException;
import jakarta.persistence.EntityNotFoundException;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import org.modelmapper.ModelMapper;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.Date;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Transactional
public class LessonService implements ILessonService{

    private final LessonRepository lessonRepository;
    private final UserRepository userRepository;
    private final ModelMapper modelMapper;
    private final ApplicationEventPublisher eventPublisher;

    @Override
    public Lesson createLesson(CreateLessonRequest request) {
        return Optional.of(request)
                .map(req -> {
                    Lesson lesson = new Lesson();
                    lesson.setStartTime(request.getStartDate());
                    lesson.setEndTime(request.getEndDate());
                    lesson.setStatus(request.getStatus());
                    validateRequest(request, lesson);
                    saveUsersReferences(lesson, req);
                    Lesson savedLesson = lessonRepository.save(lesson);
                    eventPublisher.publishEvent(new Lesson.LessonCreatedEvent(savedLesson));
                    return savedLesson;
                })
                .orElseThrow(() -> new EntityExistsException("Generic error!"));
    }

    private void validateRequest(CreateLessonRequest request, Lesson lesson) {
        if(lessonRepository.existsOverlappingLesson(lesson.getStartTime(), lesson.getEndTime()))
            throw new EntityExistsException("There is already lesson in that date at that time!");
    }

    private void saveUsersReferences(Lesson lesson, CreateLessonRequest req) {
        req.getUsers().forEach( user -> {
            User existingUser = userRepository.findById(user.getId())
                    .orElseThrow(() -> new EntityNotFoundException("User not found with id: " + user.getId()));
            lesson.addUser(existingUser);
        });
    }

    @Override
    public void confirmLesson(Long lessonId) {
        lessonRepository.findById(lessonId)
            .map(existingLesson -> {
                if(LessonStatus.DRAFT.equals(existingLesson.getStatus())) {
                    existingLesson.setStatus(LessonStatus.CONFIRMED);
                    return lessonRepository.save(existingLesson);
                }
                else {
                   throw new EntityNotFoundException("No lesson in draft status for this id: " + lessonId);
                }
            })
            .orElseThrow(() -> new EntityNotFoundException("Lesson not found with id: " + lessonId));
    }

    @Override
    public void deleteLesson(Long lessonId) {
        if(lessonId != null)
            lessonRepository.deleteById(lessonId);
    }

    @Override
    public Lesson getLessonById(Long lessonId) {
        return lessonRepository
                .findById(lessonId)
                .orElseThrow(() -> new EntityNotFoundException("Lesson not found!"));
    }

    @Override
    public LessonDto convertLessonToDto(Lesson lesson) {
        return modelMapper.map(lesson, LessonDto.class);
    }

    @Override
    public List<LessonDto> getLessonsInPeriod(Date start, Date end) {
        List<Lesson> lessons = lessonRepository.findByStartTimeBetween(start,end);
        if(lessons.isEmpty())
            return new ArrayList<>();

        return lessons.stream()
                .map(this::convertLessonToDto)
                .collect(Collectors.toList());
    }
}
