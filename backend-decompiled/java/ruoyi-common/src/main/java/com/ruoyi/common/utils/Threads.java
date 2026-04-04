/*
 * Decompiled with CFR 0.152.
 * 
 * Could not load the following classes:
 *  org.slf4j.Logger
 *  org.slf4j.LoggerFactory
 */
package com.ruoyi.common.utils;

import java.util.concurrent.CancellationException;
import java.util.concurrent.ExecutionException;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Future;
import java.util.concurrent.TimeUnit;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

public class Threads {
    private static final Logger logger = LoggerFactory.getLogger(Threads.class);

    public static void sleep(long milliseconds) {
        try {
            Thread.sleep(milliseconds);
        }
        catch (InterruptedException e) {
            return;
        }
    }

    public static void shutdownAndAwaitTermination(ExecutorService pool) {
        if (pool != null && !pool.isShutdown()) {
            pool.shutdown();
            try {
                if (!pool.awaitTermination(120L, TimeUnit.SECONDS)) {
                    pool.shutdownNow();
                    if (!pool.awaitTermination(120L, TimeUnit.SECONDS)) {
                        logger.info("Pool did not terminate");
                    }
                }
            }
            catch (InterruptedException ie) {
                pool.shutdownNow();
                Thread.currentThread().interrupt();
            }
        }
    }

    public static void printException(Runnable r, Throwable t) {
        if (t == null && r instanceof Future) {
            try {
                Future future = (Future)((Object)r);
                if (future.isDone()) {
                    future.get();
                }
            }
            catch (CancellationException ce) {
                t = ce;
            }
            catch (ExecutionException ee) {
                t = ee.getCause();
            }
            catch (InterruptedException ie) {
                Thread.currentThread().interrupt();
            }
        }
        if (t != null) {
            logger.error(t.getMessage(), t);
        }
    }
}

