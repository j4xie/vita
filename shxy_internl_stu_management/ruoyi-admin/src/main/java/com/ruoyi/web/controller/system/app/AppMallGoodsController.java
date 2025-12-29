package com.ruoyi.web.controller.system.app;

import com.ruoyi.common.core.controller.BaseController;
import com.ruoyi.common.core.domain.AjaxResult;
import com.ruoyi.common.core.page.TableDataInfo;
import com.ruoyi.system.domain.MallClassify;
import com.ruoyi.system.domain.MallPointGoods;
import com.ruoyi.system.service.IMallClassifyService;
import com.ruoyi.system.service.IMallPointGoodsService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * 分类/商品Controller
 *
 * @author ruoyi
 * @date 2025-08-18
 */
@RestController
@RequestMapping("/app/goods")
public class AppMallGoodsController extends BaseController {

    @Autowired
    private IMallClassifyService mallClassifyService;

    @Autowired
    private IMallPointGoodsService mallPointGoodsService;

    /**
     * 查询商品分类列表
     */
    @PreAuthorize("@ss.hasPermi('system:role:client')")
    @PostMapping("/classifyList")
    public TableDataInfo list(MallClassify mallClassify)
    {
        List<MallClassify> list = mallClassifyService.selectMallClassifyList(mallClassify);
        return getDataTable(list);
    }

    /**
     * 查询积分商品列表
     */
    @PreAuthorize("@ss.hasPermi('system:role:client')")
    @PostMapping("/goodsList")
    public TableDataInfo list(MallPointGoods mallPointGoods)
    {
        startPage();
        List<MallPointGoods> list = mallPointGoodsService.selectMallPointGoodsList(mallPointGoods);
        return getDataTable(list);
    }

    /**
     * 积分商品详细信息
     */
    @PreAuthorize("@ss.hasPermi('system:role:client')")
    @GetMapping(value = "/detail/{id}")
    public AjaxResult getInfo(@PathVariable("id") Long id)
    {
        AjaxResult result = null;
        if(null == id){
            result = AjaxResult.error();
            result.put("msg", "商品信息不存在");
            return result;
        }
        MallPointGoods mallPointGoods = mallPointGoodsService.selectMallPointGoodsById(id);
        if(null == mallPointGoods){
            result = AjaxResult.error();
            result.put("msg", "商品信息不存在");
            return result;
        }else{
            result = AjaxResult.success();
            result.put("data", mallPointGoods);
            return result;
        }
    }

}
