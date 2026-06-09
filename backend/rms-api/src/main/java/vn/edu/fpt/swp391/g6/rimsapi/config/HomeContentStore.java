package vn.edu.fpt.swp391.g6.rimsapi.config;

import tools.jackson.databind.ObjectMapper;
import jakarta.annotation.PostConstruct;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.ClassPathResource;
import org.springframework.stereotype.Component;

import java.io.IOException;
import java.io.InputStream;
import java.nio.file.Files;
import java.nio.file.Path;

@Component
@RequiredArgsConstructor
public class HomeContentStore
{
    private static final String DEFAULT_RESOURCE = "data/home-content.json";

    private final ObjectMapper objectMapper;

    @Value("${restaurant.home.file-path:data/home-content.json}")
    private String filePath;

    private Path contentFilePath;

    @PostConstruct
    void init() throws IOException
    {
        contentFilePath = Path.of(filePath);
        if (Files.notExists(contentFilePath))
        {
            Files.createDirectories(contentFilePath.getParent());
            try (InputStream inputStream = new ClassPathResource(DEFAULT_RESOURCE).getInputStream())
            {
                Files.copy(inputStream, contentFilePath);
            }
        }
    }

    public synchronized HomeContentData load() throws IOException
    {
        return objectMapper.readValue(contentFilePath.toFile(), HomeContentData.class);
    }

    public synchronized void save(HomeContentData data) throws IOException
    {
        objectMapper.writerWithDefaultPrettyPrinter().writeValue(contentFilePath.toFile(), data);
    }
}
