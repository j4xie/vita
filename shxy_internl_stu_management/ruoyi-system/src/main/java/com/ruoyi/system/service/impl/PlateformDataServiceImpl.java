package com.ruoyi.system.service.impl;

import java.text.DecimalFormat;
import java.util.List;
import com.ruoyi.common.utils.DateUtils;
import org.apache.http.util.TextUtils;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import com.ruoyi.system.mapper.PlateformDataMapper;
import com.ruoyi.system.domain.PlateformData;
import com.ruoyi.system.service.IPlateformDataService;

/**
 * 平台设置Service业务层处理
 * 
 * @author ruoyi
 * @date 2025-09-14
 */
@Service
public class PlateformDataServiceImpl implements IPlateformDataService 
{
    @Autowired
    private PlateformDataMapper plateformDataMapper;

    /**
     * 查询平台设置
     * 
     * @param id 平台设置主键
     * @return 平台设置
     */
    @Override
    public PlateformData selectPlateformDataById(Long id)
    {
        return plateformDataMapper.selectPlateformDataById(id);
    }

    /**
     * 查询平台设置列表
     * 
     * @param plateformData 平台设置
     * @return 平台设置
     */
    @Override
    public List<PlateformData> selectPlateformDataList(PlateformData plateformData)
    {
        return plateformDataMapper.selectPlateformDataList(plateformData);
    }

    /**
     * 新增平台设置
     * 
     * @param plateformData 平台设置
     * @return 结果
     */
    @Override
    public int insertPlateformData(PlateformData plateformData)
    {
        plateformData.setCreateTime(DateUtils.getNowDate());
        return plateformDataMapper.insertPlateformData(plateformData);
    }

    /**
     * 修改平台设置
     * 
     * @param plateformData 平台设置
     * @return 结果
     */
    @Override
    public int updatePlateformData(PlateformData plateformData)
    {
        plateformData.setUpdateTime(DateUtils.getNowDate());
        return plateformDataMapper.updatePlateformData(plateformData);
    }

    /**
     * 批量删除平台设置
     * 
     * @param ids 需要删除的平台设置主键
     * @return 结果
     */
    @Override
    public int deletePlateformDataByIds(Long[] ids)
    {
        return plateformDataMapper.deletePlateformDataByIds(ids);
    }

    /**
     * 删除平台设置信息
     * 
     * @param id 平台设置主键
     * @return 结果
     */
    @Override
    public int deletePlateformDataById(Long id)
    {
        return plateformDataMapper.deletePlateformDataById(id);
    }

    /**
     * 美元转换成人民币
     * @param usdPrice
     * @return
     */
    @Override
    public Double usdToRmbExchange(String usdPrice)
    {
        PlateformData plateformData = new PlateformData();
        plateformData.setDataKey("RMB_USD_EXCHANGE_RATE");
        List<PlateformData> plateformDataList = plateformDataMapper.selectPlateformDataList(plateformData);
        double exchangeRate = 0;
        if(plateformDataList.size() >= 0){
            String exchangeRateStr = plateformDataList.get(0).getDataValue();
            if(!TextUtils.isEmpty(exchangeRateStr)){
                exchangeRate = Double.parseDouble(exchangeRateStr);
            }
        }

        double rmbPrice = 0;

        if(!TextUtils.isEmpty(usdPrice)){
            rmbPrice = Double.parseDouble(usdPrice)*exchangeRate;
        }

        DecimalFormat df = new DecimalFormat("#.##"); // 或者使用 "0.00" 来确保总是显示两位小数，即使为零也是如此。
        String formattedNumber = df.format(rmbPrice);
        rmbPrice = Double.parseDouble(formattedNumber);

        return rmbPrice;
    }
}
