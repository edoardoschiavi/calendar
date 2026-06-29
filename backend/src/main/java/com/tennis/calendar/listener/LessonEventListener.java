package com.tennis.calendar.listener;

import com.tennis.calendar.model.Lesson;
import com.tennis.calendar.model.User;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.context.event.EventListener;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
@Slf4j
public class LessonEventListener {
    private final JavaMailSender mailSender;

    @Async // Rende l'operazione non-bloccante
    @EventListener
    public void handleLessonCreatedEvent(Lesson.LessonCreatedEvent event) {
        log.info("Inizio elaborazione invio email per la lezione ID: {}", event.lesson().getId());

        // Cicliamo gli utenti associati alla lezione per inviare la mail a ciascuno
        for (User user : event.lesson().getUsers()) {
            try {
                SimpleMailMessage message = new SimpleMailMessage();
                message.setFrom("info@tenniscalendar.com");
                message.setTo(user.getEmail());
                message.setSubject("Nuova Lezione di Tennis Prenotata!");
                message.setText(String.format(
                        "Ciao %s %s,\n\nTi confermiamo che è stata inserita una nuova lezione il %s.\n\nBuon allenamento!",
                        user.getFirstName(),
                        user.getLastName(),
                        event.lesson().getStartTime()
                ));

                mailSender.send(message);
                log.info("Email inviata con successo a: {}", user.getEmail());
            } catch (Exception e) {
                log.error("Errore durante l'invio dell'email a {}: {}", user.getEmail(), e.getMessage());
            }
        }
    }
}
