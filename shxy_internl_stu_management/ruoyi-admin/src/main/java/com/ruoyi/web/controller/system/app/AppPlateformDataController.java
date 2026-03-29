package com.ruoyi.web.controller.system.app;

import com.ruoyi.common.core.controller.BaseController;
import com.ruoyi.common.core.domain.AjaxResult;
import com.ruoyi.common.core.page.TableDataInfo;
import com.ruoyi.system.domain.Invitation;
import com.ruoyi.system.domain.PlateformData;
import com.ruoyi.system.service.IInvitationService;
import com.ruoyi.system.service.IPlateformDataService;
import org.apache.http.util.TextUtils;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.text.DecimalFormat;
import java.util.List;
import java.util.Random;

/**
 * 数据Controller
 * 
 * @author ruoyi
 * @date 2025-08-18
 */
@RestController
@RequestMapping("/app/plateformData")
public class AppPlateformDataController extends BaseController
{
    @Autowired
    private IPlateformDataService iPlateformDataService;


    /**
     * 美元换算成人民币
     * @param usdPrice
     * @return
     */
    @GetMapping("/usdToRmb")
    public AjaxResult usdToRmb(String usdPrice)
    {
        double rmbPrice = 0;
        if(!TextUtils.isEmpty(usdPrice)){
            rmbPrice = iPlateformDataService.usdToRmbExchange(usdPrice);
        }
        AjaxResult ajaxResult = AjaxResult.success();
        ajaxResult.put("data", rmbPrice);
        return ajaxResult;
    }

    /**
     * 1美元 ≈  ？人民币 汇率获取
     * @param
     * @return
     */
    @GetMapping("/usdToRmbExchangeRate")
    public AjaxResult usdToRmbExchangeRate()
    {
        PlateformData plateformData = new PlateformData();
        plateformData.setDataKey("RMB_USD_EXCHANGE_RATE");
        List<PlateformData> plateformDataList = iPlateformDataService.selectPlateformDataList(plateformData);
        if(plateformDataList.size() <= 0){
            AjaxResult ajaxResult = AjaxResult.error();
            ajaxResult.put("msg", "系统未配置参数");
        }
        String exchangeRateStr = plateformDataList.get(0).getDataValue();
        double exchangeRate = 0;
        if(!TextUtils.isEmpty(exchangeRateStr)){
            exchangeRate = Double.parseDouble(exchangeRateStr);
        }

        DecimalFormat df = new DecimalFormat("#.##"); // 或者使用 "0.00" 来确保总是显示两位小数，即使为零也是如此。
        String formattedNumber = df.format(exchangeRate);
        exchangeRate = Double.parseDouble(formattedNumber);

        AjaxResult ajaxResult = AjaxResult.success();
        ajaxResult.put("exchangeRate", exchangeRate);
        return ajaxResult;
    }

}
