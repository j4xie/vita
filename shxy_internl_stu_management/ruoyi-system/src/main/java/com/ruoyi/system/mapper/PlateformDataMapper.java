package com.ruoyi.system.mapper;

import java.util.List;
import com.ruoyi.system.domain.PlateformData;

/**
 * 平台设置Mapper接口
 * 
 * @author ruoyi
 * @date 2025-09-14
 */
public interface PlateformDataMapper 
{
    /**
     * 查询平台设置
     * 
     * @param id 平台设置主键
     * @return 平台设置
     */
    public PlateformData selectPlateformDataById(Long id);

    /**
     * 查询平台设置列表
     * 
     * @param plateformData 平台设置
     * @return 平台设置集合
     */
    public List<PlateformData> selectPlateformDataList(PlateformData plateformData);

    /**
     * 新增平台设置
     * 
     * @param plateformData 平台设置
     * @return 结果
     */
    public int insertPlateformData(PlateformData plateformData);

    /**
     * 修改平台设置
     * 
     * @param plateformData 平台设置
     * @return 结果
     */
    public int updatePlateformData(PlateformData plateformData);

    /**
     * 删除平台设置
     * 
     * @param id 平台设置主键
     * @return 结果
     */
    public int deletePlateformDataById(Long id);

    /**
     * 批量删除平台设置
     * 
     * @param ids 需要删除的数据主键集合
     * @return 结果
     */
    public int deletePlateformDataByIds(Long[] ids);
}
