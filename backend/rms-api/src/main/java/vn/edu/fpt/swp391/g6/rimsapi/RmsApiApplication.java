package vn.edu.fpt.swp391.g6.rimsapi;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.data.jpa.repository.config.EnableJpaAuditing;


@SpringBootApplication
@EnableJpaAuditing
public class RmsApiApplication {

	public static void main(String[] args) {
		SpringApplication.run(RmsApiApplication.class, args);
	}

}
