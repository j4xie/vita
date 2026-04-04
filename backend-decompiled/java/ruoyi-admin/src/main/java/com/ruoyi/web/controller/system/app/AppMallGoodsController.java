/*
 * Decompiled with CFR 0.152.
 * 
 * Could not load the following classes:
 *  com.ruoyi.common.core.controller.BaseController
 *  com.ruoyi.common.core.domain.AjaxResult
 *  com.ruoyi.common.core.page.TableDataInfo
 *  com.ruoyi.system.domain.MallClassify
 *  com.ruoyi.system.domain.MallPointGoods
 *  com.ruoyi.system.service.IMallClassifyService
 *  com.ruoyi.system.service.IMallPointGoodsService
 *  org.springframework.beans.factory.annotation.Autowired
 *  org.springframework.security.access.prepost.PreAuthorize
 *  org.springframework.web.bind.annotation.GetMapping
 *  org.springframework.web.bind.annotation.PathVariable
 *  org.springframework.web.bind.annotation.PostMapping
 *  org.springframework.web.bind.annotation.RequestMapping
 *  org.springframework.web.bind.annotation.RestController
 */
package com.ruoyi.web.controller.system.app;

import com.ruoyi.common.core.controller.BaseController;
import com.ruoyi.common.core.domain.AjaxResult;
import com.ruoyi.common.core.page.TableDataInfo;
import com.ruoyi.system.domain.MallClassify;
import com.ruoyi.system.domain.MallPointGoods;
import com.ruoyi.system.service.IMallClassifyService;
import com.ruoyi.system.service.IMallPointGoodsService;
import java.util.List;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping(value={"/app/goods"})
public class AppMallGoodsController
extends BaseController {
    @Autowired
    private IMallClassifyService mallClassifyService;
    @Autowired
    private IMallPointGoodsService mallPointGoodsService;

    @PreAuthorize(value="@ss.hasPermi('system:role:client')")
    @PostMapping(value={"/classifyList"})
    public TableDataInfo list(MallClassify mallClassify) {
        List list = this.mallClassifyService.selectMallClassifyList(mallClassify);
        return this.getDataTable(list);
    }

    @PreAuthorize(value="@ss.hasPermi('system:role:client')")
    @PostMapping(value={"/goodsList"})
    public TableDataInfo list(MallPointGoods mallPointGoods) {
        this.startPage();
        List list = this.mallPointGoodsService.selectMallPointGoodsList(mallPointGoods);
        return this.getDataTable(list);
    }

    @PreAuthorize(value="@ss.hasPermi('system:role:client')")
    @GetMapping(value={"/detail/{id}"})
    public AjaxResult getInfo(@PathVariable(value="id") Long id) {
        AjaxResult result = null;
        if (null == id) {
            result = AjaxResult.error();
            result.put("msg", (Object)"\u5546\u54c1\u4fe1\u606f\u4e0d\u5b58\u5728");
            return result;
        }
        MallPointGoods mallPointGoods = this.mallPointGoodsService.selectMallPointGoodsById(id);
        if (null == mallPointGoods) {
            result = AjaxResult.error();
            result.put("msg", (Object)"\u5546\u54c1\u4fe1\u606f\u4e0d\u5b58\u5728");
            return result;
        }
        result = AjaxResult.success();
        result.put("data", (Object)mallPointGoods);
        return result;
    }
}
