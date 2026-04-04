/*
 * Decompiled with CFR 0.152.
 * 
 * Could not load the following classes:
 *  org.apache.poi.ss.usermodel.Cell
 *  org.apache.poi.ss.usermodel.Workbook
 */
package com.ruoyi.common.utils.poi;

import org.apache.poi.ss.usermodel.Cell;
import org.apache.poi.ss.usermodel.Workbook;

public interface ExcelHandlerAdapter {
    public Object format(Object var1, String[] var2, Cell var3, Workbook var4);
}

