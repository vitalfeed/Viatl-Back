# Use a stable JDK base image
FROM eclipse-temurin:21-jdk

# Set working directory
WORKDIR /app

# Copy Maven wrapper and pom.xml
COPY mvnw .
COPY .mvn .mvn
COPY pom.xml .

# Make mvnw executable
RUN chmod +x mvnw

# Pre-download dependencies (cache)
RUN ./mvnw dependency:go-offline -B

# Copy source code (all of it)
COPY src ./src

# Build the application (produces target/*.jar)
RUN ./mvnw clean package -DskipTests

# Optional: verify JAR exists
RUN ls -l target/

# Expose port
EXPOSE 8080

# Run the built JAR (replace with your actual JAR name)
CMD ["java", "-jar", "target/formulaireveterinaire-0.0.1-SNAPSHOT.jar"]
