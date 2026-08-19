# Stage 1: Runtime image with Eclipse Temurin OpenJDK 17
FROM eclipse-temurin:17-jre-alpine

WORKDIR /app

# Run as non-root user
RUN addgroup -S appgroup && adduser -S appuser -G appgroup
USER appuser

# Copy artifact built by Maven
ARG JAR_FILE=target/*.jar
COPY ${JAR_FILE} app.jar

EXPOSE 8080

ENV JAVA_OPTS="-Xms256m -Xmx512m"

ENTRYPOINT ["sh", "-c", "java ${JAVA_OPTS} -jar app.jar"]
