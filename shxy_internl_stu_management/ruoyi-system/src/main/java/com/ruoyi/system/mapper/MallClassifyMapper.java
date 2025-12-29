package com.ruoyi.system.mapper;

import java.util.List;
import com.ruoyi.system.domain.MallClassify;

/**
 * 商品分类Mapper接口
 * 
 * @author ruoyi
 * @date 2025-09-15
 */
public interface MallClassifyMapper 
{
    /**
     * 查询商品分类
     * 
     * @param id 商品分类主键
     * @return 商品分类
     */
    public MallClassify selectMallClassifyById(Long id);

    /**
     * 查询商品分类列表
     * 
     * @param mallClassify 商品分类
     * @return 商品分类集合
     */
    public List<MallClassify> selectMallClassifyList(MallClassify mallClassify);

    /**
     * 新增商品分类
     * 
     * @param mallClassify 商品分类
     * @return 结果
     */
    public int insertMallClassify(MallClassify mallClassify);

    /**
     * 修改商品分类
     * 
     * @param mallClassify 商品分类
     * @return 结果
     */
    public int updateMallClassify(MallClassify mallClassify);

    /**
     * 删除商品分类
     * 
     * @param id 商品分类主键
     * @return 结果
     */
    public int deleteMallClassifyById(Long id);

    /**
     * 批量删除商品分类
     * 
     * @param ids 需要删除的数据主键集合
     * @return 结果
     */
    public int deleteMallClassifyByIds(Long[] ids);
}
