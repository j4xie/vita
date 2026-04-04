/*
 * Decompiled with CFR 0.152.
 * 
 * Could not load the following classes:
 *  org.springframework.aop.framework.Advised
 *  org.springframework.aop.framework.AopContext
 *  org.springframework.beans.BeansException
 *  org.springframework.beans.factory.NoSuchBeanDefinitionException
 *  org.springframework.beans.factory.config.BeanFactoryPostProcessor
 *  org.springframework.beans.factory.config.ConfigurableListableBeanFactory
 *  org.springframework.context.ApplicationContext
 *  org.springframework.context.ApplicationContextAware
 *  org.springframework.stereotype.Component
 */
package com.ruoyi.common.utils.spring;

import com.ruoyi.common.utils.StringUtils;
import org.springframework.aop.framework.Advised;
import org.springframework.aop.framework.AopContext;
import org.springframework.beans.BeansException;
import org.springframework.beans.factory.NoSuchBeanDefinitionException;
import org.springframework.beans.factory.config.BeanFactoryPostProcessor;
import org.springframework.beans.factory.config.ConfigurableListableBeanFactory;
import org.springframework.context.ApplicationContext;
import org.springframework.context.ApplicationContextAware;
import org.springframework.stereotype.Component;

@Component
public final class SpringUtils
implements BeanFactoryPostProcessor,
ApplicationContextAware {
    private static ConfigurableListableBeanFactory beanFactory;
    private static ApplicationContext applicationContext;

    public void postProcessBeanFactory(ConfigurableListableBeanFactory beanFactory) throws BeansException {
        SpringUtils.beanFactory = beanFactory;
    }

    public void setApplicationContext(ApplicationContext applicationContext) throws BeansException {
        SpringUtils.applicationContext = applicationContext;
    }

    public static <T> T getBean(String name) throws BeansException {
        return (T)beanFactory.getBean(name);
    }

    public static <T> T getBean(Class<T> clz) throws BeansException {
        Object result = beanFactory.getBean(clz);
        return (T)result;
    }

    public static boolean containsBean(String name) {
        return beanFactory.containsBean(name);
    }

    public static boolean isSingleton(String name) throws NoSuchBeanDefinitionException {
        return beanFactory.isSingleton(name);
    }

    public static Class<?> getType(String name) throws NoSuchBeanDefinitionException {
        return beanFactory.getType(name);
    }

    public static String[] getAliases(String name) throws NoSuchBeanDefinitionException {
        return beanFactory.getAliases(name);
    }

    public static <T> T getAopProxy(T invoker) {
        Object proxy = AopContext.currentProxy();
        if (((Advised)proxy).getTargetSource().getTargetClass() == invoker.getClass()) {
            return (T)proxy;
        }
        return invoker;
    }

    public static String[] getActiveProfiles() {
        return applicationContext.getEnvironment().getActiveProfiles();
    }

    public static String getActiveProfile() {
        Object[] activeProfiles = SpringUtils.getActiveProfiles();
        return StringUtils.isNotEmpty(activeProfiles) ? activeProfiles[0] : null;
    }

    public static String getRequiredProperty(String key) {
        return applicationContext.getEnvironment().getRequiredProperty(key);
    }
}

