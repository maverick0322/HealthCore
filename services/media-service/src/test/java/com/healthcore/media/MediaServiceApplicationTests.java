package com.healthcore.media;

import org.junit.jupiter.api.Test;
import org.springframework.boot.test.context.SpringBootTest;

@SpringBootTest(
		properties = {
				// Fake values injection in order to springboot context
				// can run test enviroment without reading .env file
				"cloudflare.r2.endpoint=https://mock.r2.cloudflarestorage.com",
				"cloudflare.r2.access-key-id=mock-access-key",
				"cloudflare.r2.secret-access-key=mock-secret-key",
				"cloudflare.r2.bucket-name=mock-bucket",
				"jwt.secret=esta-es-una-llave-falsa-super-larga-solo-para-que-pase-el-test-de-spring-boot"
		}
)
class MediaServiceApplicationTests {

	@Test
	void contextLoads() {
		// This test only tests that Spring Boot Beans and configuration
		// work without fatal errors
	}

}
