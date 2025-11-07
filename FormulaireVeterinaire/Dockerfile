
FROM eclipse-temurin:21-jdk

# Set working directory
WORKDIR /app

# Copy the Maven files
COPY pom.xml .
COPY src ./src

# Package the app
RUN ./mvnw clean package -DskipTests

# Expose the port used by your Spring Boot app
EXPOSE 8080

# Run the JAR file
CMD ["java", "-jar", "target/*.jar"]
