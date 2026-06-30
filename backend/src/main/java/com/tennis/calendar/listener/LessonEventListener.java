package com.tennis.calendar.listener;

import com.tennis.calendar.model.Lesson;
import com.tennis.calendar.model.User;
import jakarta.mail.internet.MimeMessage;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.event.EventListener;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Component;

import java.text.SimpleDateFormat;

@Component
@RequiredArgsConstructor
@Slf4j
public class LessonEventListener {
    private final JavaMailSender mailSender;
    @Value("${spring.mail.username}")
    private String emailSenderAddress;

    @Async
    @EventListener
    public void handleLessonCreatedEvent(Lesson.LessonCreatedEvent event) {
        log.info("Inizio elaborazione invio email per la lezione ID: {}", event.lesson().getId());
        SimpleDateFormat formatter = new SimpleDateFormat("dd/MM/yyyy 'alle ore' HH:mm");
        String convertedDate = formatter.format(event.lesson().getStartTime());

        // Cicliamo gli utenti associati alla lezione per inviare la mail a ciascuno
        for (User user : event.lesson().getUsers()) {
            try {
                MimeMessage mimeMessage = mailSender.createMimeMessage();
                MimeMessageHelper helper = new MimeMessageHelper(mimeMessage, true, "UTF-8");

                helper.setFrom(emailSenderAddress);
                helper.setTo(user.getEmail());
                helper.setSubject("🎾 Conferma Prenotazione Lezione di Tennis");

                // 3. Costruiamo il body in HTML con CSS inline per renderlo carino
                String htmlBody = buildHtmlEmail(user.getFirstName(), convertedDate);

                // 4. Il secondo parametro 'true' dice a Spring che questo testo è HTML!
                helper.setText(htmlBody, true);

                mailSender.send(mimeMessage);
                log.info("Email HTML inviata con successo a: {}", user.getEmail());
            } catch (Exception e) {
                log.error("Errore durante l'invio dell'email HTML a {}: {}", user.getEmail(), e.getMessage());
            }
        }
    }

    private String buildHtmlEmail(String name, String date) {
        return "<html>" +
                "<body style='font-family: Arial, sans-serif; background-color: #f4f4f4; margin: 0; padding: 20px;'>" +
                "  <div style='max-width: 600px; margin: 0 auto; background-color: #ffffff; padding: 30px; border-radius: 8px; box-shadow: 0 4px 8px rgba(0,0,0,0.05);'>" +
                "    <div style='text-align: center; border-bottom: 2px solid #4CAF50; padding-bottom: 20px;'>" +
                "      <h1 style='color: #4CAF50; margin: 0;'>Tennis Calendar</h1>" +
                "    </div>" +
                "    <div style='padding: 20px 0; color: #333333; line-height: 1.6;'>" +
                "      <p style='font-size: 16px;'>Ciao <strong>" + name + "</strong>,</p>" +
                "      <p style='font-size: 15px;'>Ti confermiamo che la tua lezione di tennis è stata registrata con successo nel sistema!</p>" +
                "      " +
                "      " +
                "      <div style='background-color: #f9f9f9; border-left: 4px solid #4CAF50; padding: 15px; margin: 20px 0; font-size: 15px;'>" +
                "        🗓️ <strong>Data e Ora:</strong> " + date + "<br>" +
                "        📍 <strong>Luogo:</strong> Campo Centrale" +
                "      </div>" +
                "      " +
                "      <p style='font-size: 15px;'>Ricordati di portare la racchetta e presentarti con 10 minuti di anticipo.</p>" +
                "    </div>" +
                "    <div style='text-align: center; padding-top: 20px; border-top: 1px solid #eeeeee; font-size: 12px; color: #888888;'>" +
                "      <p>Questa è una notifica automatica, si prega di non rispondere a questa email.</p>" +
                "    </div>" +
                "  </div>" +
                "</body>" +
                "</html>";
    }
}
