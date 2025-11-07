# Use a stable JDK base image
FROM eclipse-temurin:21-jdk

# Set working directory
WORKDIR /app

# Copy Maven wrapper and pom.xml
COPY mvnw .
COPY .mvn .mvn
COPY pom.xml .

# Pre-download dependencies (cache)
RUN ./mvnw dependency:go-offline -B

# Copy source code
COPY src ./src

# Build
RUN ./mvnw clean package -DskipTests

# Expose app port
EXPOSE 8080

# Run jar
CMD ["java", "-jar", "target/*.jar"]
