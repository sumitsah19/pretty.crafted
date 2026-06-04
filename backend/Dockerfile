## Multi-stage Dockerfile for smaller Railway images
## Builder: build the fat jar with Maven
FROM maven:3.9.4-eclipse-temurin-21 AS builder
WORKDIR /app
COPY pom.xml mvnw .mvn/ ./
COPY src ./src
RUN mvn -B -DskipTests package

## Runtime: minimal JRE image
FROM eclipse-temurin:21-jre-jammy
WORKDIR /app
COPY --from=builder /app/target/*.jar app.jar
ENV JAVA_OPTS="-Xms128m -Xmx512m -XX:+UseContainerSupport -XX:+FlightRecorder"
EXPOSE 8080
ENTRYPOINT ["sh", "-c", "java $JAVA_OPTS -jar /app/app.jar"]
