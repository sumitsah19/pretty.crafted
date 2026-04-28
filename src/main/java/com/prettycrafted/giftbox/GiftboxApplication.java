package com.prettycrafted.giftbox;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableAsync;

@SpringBootApplication
@EnableAsync
public class GiftboxApplication {

	public static void main(String[] args) {
		SpringApplication.run(GiftboxApplication.class, args);
	}

}
