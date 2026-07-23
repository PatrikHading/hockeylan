package com.norops.hockeylan;

import org.junit.jupiter.api.Test;
import org.springframework.boot.autoconfigure.SpringBootApplication;

import static org.junit.jupiter.api.Assertions.assertNotNull;

class HockeylanApplicationTests {

	@Test
	void applicationClassShouldDeclareSpringBootApplication() {
		SpringBootApplication annotation =
				HockeylanApplication.class.getAnnotation(SpringBootApplication.class);

		assertNotNull(
				annotation,
				"HockeylanApplication must be annotated with @SpringBootApplication"
		);
	}
}