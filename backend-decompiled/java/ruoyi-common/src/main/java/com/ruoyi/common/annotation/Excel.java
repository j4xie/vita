/*
 * Decompiled with CFR 0.152.
 * 
 * Could not load the following classes:
 *  org.apache.poi.ss.usermodel.HorizontalAlignment
 *  org.apache.poi.ss.usermodel.IndexedColors
 */
package com.ruoyi.common.annotation;

import com.ruoyi.common.utils.poi.ExcelHandlerAdapter;
import java.lang.annotation.ElementType;
import java.lang.annotation.Retention;
import java.lang.annotation.RetentionPolicy;
import java.lang.annotation.Target;
import org.apache.poi.ss.usermodel.HorizontalAlignment;
import org.apache.poi.ss.usermodel.IndexedColors;

@Retention(value=RetentionPolicy.RUNTIME)
@Target(value={ElementType.FIELD})
public @interface Excel {
    public int sort() default 0x7FFFFFFF;

    public String name() default "";

    public String dateFormat() default "";

    public String dictType() default "";

    public String readConverterExp() default "";

    public String separator() default ",";

    public int scale() default -1;

    public int roundingMode() default 6;

    public double height() default 14.0;

    public double width() default 16.0;

    public String suffix() default "";

    public String defaultValue() default "";

    public String prompt() default "";

    public boolean wrapText() default false;

    public String[] combo() default {};

    public boolean comboReadDict() default false;

    public boolean needMerge() default false;

    public boolean isExport() default true;

    public String targetAttr() default "";

    public boolean isStatistics() default false;

    public ColumnType cellType() default ColumnType.STRING;

    public IndexedColors headerBackgroundColor() default IndexedColors.GREY_50_PERCENT;

    public IndexedColors headerColor() default IndexedColors.WHITE;

    public IndexedColors backgroundColor() default IndexedColors.WHITE;

    public IndexedColors color() default IndexedColors.BLACK;

    public HorizontalAlignment align() default HorizontalAlignment.CENTER;

    public Class<?> handler() default ExcelHandlerAdapter.class;

    public String[] args() default {};

    public Type type() default Type.ALL;

    public static enum ColumnType {
        NUMERIC(0),
        STRING(1),
        IMAGE(2),
        TEXT(3);

        private final int value;

        private ColumnType(int value) {
            this.value = value;
        }

        public int value() {
            return this.value;
        }
    }

    public static enum Type {
        ALL(0),
        EXPORT(1),
        IMPORT(2);

        private final int value;

        private Type(int value) {
            this.value = value;
        }

        public int value() {
            return this.value;
        }
    }
}

