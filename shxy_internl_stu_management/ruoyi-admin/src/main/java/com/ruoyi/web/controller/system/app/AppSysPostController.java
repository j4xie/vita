package com.ruoyi.web.controller.system.app;

import com.ruoyi.common.core.controller.BaseController;
import com.ruoyi.common.core.page.TableDataInfo;
import com.ruoyi.common.core.domain.entity.SysPost;
import com.ruoyi.system.service.ISysPostService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * 岗位信息操作处理
 * 
 * @author ruoyi
 */
@RestController
@RequestMapping("/app/post")
public class AppSysPostController extends BaseController
{
    @Autowired
    private ISysPostService postService;

    /**
     * 获取岗位列表
     */
    @GetMapping("/list")
    public TableDataInfo list(SysPost post)
    {
        startPage();
        List<SysPost> list = postService.selectPostList(post);
        return getDataTable(list);
    }
    
}
