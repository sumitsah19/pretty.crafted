package com.prettycrafted.giftbox.config;

import io.sentry.Sentry;
import java.lang.reflect.Method;
import java.util.concurrent.Executor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.aop.interceptor.AsyncUncaughtExceptionHandler;
import org.springframework.context.annotation.Configuration;
import org.springframework.scheduling.annotation.AsyncConfigurer;
import org.springframework.scheduling.concurrent.ThreadPoolTaskExecutor;

@Slf4j
@Configuration
public class AsyncConfig implements AsyncConfigurer {

    /**
     * Dedicated, deliberately small pool for {@code @Async} work (order/payment
     * emails, which each render an invoice PDF via PDFBox — a transient memory
     * spike of tens of MB per render). Capping concurrency at 2 bounds that spike;
     * core threads time out so the pool holds zero threads at rest. Replaces Spring
     * Boot's default 8-core application task executor for async dispatch.
     *
     * <p>These are intentionally PLATFORM threads, even though virtual threads are
     * enabled application-wide ({@code spring.threads.virtual.enabled=true}). PDFBox
     * is CPU/memory-bound and uses internal {@code synchronized} blocks that would
     * pin a carrier thread on Java 21; keeping it on a small bounded platform-thread
     * pool avoids that and keeps the memory spike capped. Request-path work (JDBC,
     * Hibernate) still runs on virtual threads via Tomcat.
     */
    @Override
    public Executor getAsyncExecutor() {
        ThreadPoolTaskExecutor executor = new ThreadPoolTaskExecutor();
        executor.setCorePoolSize(1);
        executor.setMaxPoolSize(2);
        executor.setQueueCapacity(50);
        executor.setKeepAliveSeconds(30);
        executor.setAllowCoreThreadTimeOut(true);
        executor.setThreadNamePrefix("async-");
        executor.initialize();
        return executor;
    }

    @Override
    public AsyncUncaughtExceptionHandler getAsyncUncaughtExceptionHandler() {
        return (Throwable ex, Method method, Object... params) -> {
            log.error("Uncaught exception in async method {}(): {}", method.getName(), ex.getMessage(), ex);
            Sentry.captureException(ex);
        };
    }
}
