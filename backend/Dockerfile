# Fase 1: Compilazione del codice (Build)
FROM maven:3.8.5-openjdk-17 AS build
WORKDIR /app
# Copia il file pom.xml e scarica le dipendenze (ottimizza la cache di Docker)
COPY pom.xml .
RUN mvn dependency:go-offline
# Copia il codice sorgente e compila il file .jar (saltando i test per velocizzare)
COPY src ./src
RUN mvn clean package -DskipTests

# Fase 2: Creazione dell'immagine finale leggera per l'esecuzione
FROM amazoncorretto:17-alpine
WORKDIR /app
# Copia il file .jar generato nella fase precedente
COPY --from=build /app/target/*.jar app.jar
# Espone la porta standard di Spring Boot
EXPOSE 8080
# Comando per avviare l'applicazione
ENTRYPOINT ["java", "-jar", "app.jar"]