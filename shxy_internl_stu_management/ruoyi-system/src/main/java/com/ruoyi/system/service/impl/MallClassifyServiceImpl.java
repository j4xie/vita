package com.ruoyi.system.service.impl;

import java.util.List;
import com.ruoyi.common.utils.DateUtils;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import com.ruoyi.system.mapper.MallClassifyMapper;
import com.ruoyi.system.domain.MallClassify;
import com.ruoyi.system.service.IMallClassifyService;

/**
 * 商品分类Service业务层处理
 * 
 * @author ruoyi
 * @date 2025-09-15
 */
@Service
public class MallClassifyServiceImpl implements IMallClassifyService 
{
    @Autowired
    private MallClassifyMapper mallClassifyMapper;

    /**
     * 查询商品分类
     * 
     * @param id 商品分类主键
     * @return 商品分类
     */
    @Override
    public MallClassify selectMallClassifyById(Long id)
    {
        return mallClassifyMapper.selectMallClassifyById(id);
    }

    /**
     * 查询商品分类列表
     * 
     * @param mallClassify 商品分类
     * @return 商品分类
     */
    @Override
    public List<MallClassify> selectMallClassifyList(MallClassify mallClassify)
    {
        return mallClassifyMapper.selectMallClassifyList(mallClassify);
    }

    /**
     * 新增商品分类
     * 
     * @param mallClassify 商品分类
     * @return 结果
     */
    @Override
    public int insertMallClassify(MallClassify mallClassify)
    {
        mallClassify.setCreateTime(DateUtils.getNowDate());
        return mallClassifyMapper.insertMallClassify(mallClassify);
    }

    /**
     * 修改商品分类
     * 
     * @param mallClassify 商品分类
     * @return 结果
     */
    @Override
    public int updateMallClassify(MallClassify mallClassify)
    {
        mallClassify.setUpdateTime(DateUtils.getNowDate());
        return mallClassifyMapper.updateMallClassify(mallClassify);
    }

    /**
     * 批量删除商品分类
     * 
     * @param ids 需要删除的商品分类主键
     * @return 结果
     */
    @Override
    public int deleteMallClassifyByIds(Long[] ids)
    {
        return mallClassifyMapper.deleteMallClassifyByIds(ids);
    }

    /**
     * 删除商品分类信息
     * 
     * @param id 商品分类主键
     * @return 结果
     */
    @Override
    public int deleteMallClassifyById(Long id)
    {
        return mallClassifyMapper.deleteMallClassifyById(id);
    }
}
