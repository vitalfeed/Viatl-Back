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

# Copy source code
COPY src ./src

# Build the application (skip tests to speed up)
RUN ./mvnw clean package -DskipTests

# Expose app port
EXPOSE 8080

# Run the jar
CMD ["java", "-jar", "target/*.jar"]
