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
# Low-memory tuning for Railway:
#  -Xmx320m        cap heap (this app is light; raise to 384m only if GC pressure appears)
#  -XX:+UseSerialGC single-threaded GC — smallest native/GC-thread footprint for <=1 vCPU, <=512MB
#  -XX:MaxMetaspaceSize cap class-metadata growth so RSS can't creep
#  -Xss512k        smaller thread stacks (Tomcat keeps many worker threads)
#  -XX:TieredStopAtLevel=1  skip the C2 JIT — less compiler memory & faster boot, fine for low QPS
#  -XX:+ExitOnOutOfMemoryError  let Railway restart cleanly instead of thrashing on OOM
# FlightRecorder removed: it kept recording buffers resident with no one consuming them.
ENV JAVA_OPTS="-Xms128m -Xmx320m -XX:+UseSerialGC -XX:MaxMetaspaceSize=128m -Xss512k -XX:TieredStopAtLevel=1 -XX:+ExitOnOutOfMemoryError"
EXPOSE 8080
ENTRYPOINT ["sh", "-c", "java $JAVA_OPTS -jar /app/app.jar"]
