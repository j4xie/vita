/*
 * Decompiled with CFR 0.152.
 * 
 * Could not load the following classes:
 *  com.ruoyi.common.core.controller.BaseController
 *  com.ruoyi.common.core.domain.R
 *  com.ruoyi.common.utils.StringUtils
 *  io.swagger.annotations.Api
 *  io.swagger.annotations.ApiImplicitParam
 *  io.swagger.annotations.ApiImplicitParams
 *  io.swagger.annotations.ApiOperation
 *  org.springframework.web.bind.annotation.DeleteMapping
 *  org.springframework.web.bind.annotation.GetMapping
 *  org.springframework.web.bind.annotation.PathVariable
 *  org.springframework.web.bind.annotation.PostMapping
 *  org.springframework.web.bind.annotation.PutMapping
 *  org.springframework.web.bind.annotation.RequestBody
 *  org.springframework.web.bind.annotation.RequestMapping
 *  org.springframework.web.bind.annotation.RestController
 */
package com.ruoyi.web.controller.tool;

import com.ruoyi.common.core.controller.BaseController;
import com.ruoyi.common.core.domain.R;
import com.ruoyi.common.utils.StringUtils;
import com.ruoyi.web.controller.tool.UserEntity;
import io.swagger.annotations.Api;
import io.swagger.annotations.ApiImplicitParam;
import io.swagger.annotations.ApiImplicitParams;
import io.swagger.annotations.ApiOperation;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@Api(value="\u7528\u6237\u4fe1\u606f\u7ba1\u7406")
@RestController
@RequestMapping(value={"/test/user"})
public class TestController
extends BaseController {
    private static final Map<Integer, UserEntity> users = new LinkedHashMap<Integer, UserEntity>();

    public TestController() {
        users.put(1, new UserEntity(1, "admin", "admin123", "15888888888"));
        users.put(2, new UserEntity(2, "ry", "admin123", "15666666666"));
    }

    @ApiOperation(value="\u83b7\u53d6\u7528\u6237\u5217\u8868")
    @GetMapping(value={"/list"})
    public R<List<UserEntity>> userList() {
        ArrayList<UserEntity> userList = new ArrayList<UserEntity>(users.values());
        return R.ok(userList);
    }

    @ApiOperation(value="\u83b7\u53d6\u7528\u6237\u8be6\u7ec6")
    @ApiImplicitParam(name="userId", value="\u7528\u6237ID", required=true, dataType="int", paramType="path", dataTypeClass=Integer.class)
    @GetMapping(value={"/{userId}"})
    public R<UserEntity> getUser(@PathVariable Integer userId) {
        if (!users.isEmpty() && users.containsKey(userId)) {
            return R.ok((Object)users.get(userId));
        }
        return R.fail((String)"\u7528\u6237\u4e0d\u5b58\u5728");
    }

    @ApiOperation(value="\u65b0\u589e\u7528\u6237")
    @ApiImplicitParams(value={@ApiImplicitParam(name="userId", value="\u7528\u6237id", dataType="Integer", dataTypeClass=Integer.class), @ApiImplicitParam(name="username", value="\u7528\u6237\u540d\u79f0", dataType="String", dataTypeClass=String.class), @ApiImplicitParam(name="password", value="\u7528\u6237\u5bc6\u7801", dataType="String", dataTypeClass=String.class), @ApiImplicitParam(name="mobile", value="\u7528\u6237\u624b\u673a", dataType="String", dataTypeClass=String.class)})
    @PostMapping(value={"/save"})
    public R<String> save(UserEntity user) {
        if (StringUtils.isNull((Object)user) || StringUtils.isNull((Object)user.getUserId())) {
            return R.fail((String)"\u7528\u6237ID\u4e0d\u80fd\u4e3a\u7a7a");
        }
        users.put(user.getUserId(), user);
        return R.ok();
    }

    @ApiOperation(value="\u66f4\u65b0\u7528\u6237")
    @PutMapping(value={"/update"})
    public R<String> update(@RequestBody UserEntity user) {
        if (StringUtils.isNull((Object)user) || StringUtils.isNull((Object)user.getUserId())) {
            return R.fail((String)"\u7528\u6237ID\u4e0d\u80fd\u4e3a\u7a7a");
        }
        if (users.isEmpty() || !users.containsKey(user.getUserId())) {
            return R.fail((String)"\u7528\u6237\u4e0d\u5b58\u5728");
        }
        users.remove(user.getUserId());
        users.put(user.getUserId(), user);
        return R.ok();
    }

    @ApiOperation(value="\u5220\u9664\u7528\u6237\u4fe1\u606f")
    @ApiImplicitParam(name="userId", value="\u7528\u6237ID", required=true, dataType="int", paramType="path", dataTypeClass=Integer.class)
    @DeleteMapping(value={"/{userId}"})
    public R<String> delete(@PathVariable Integer userId) {
        if (!users.isEmpty() && users.containsKey(userId)) {
            users.remove(userId);
            return R.ok();
        }
        return R.fail((String)"\u7528\u6237\u4e0d\u5b58\u5728");
    }
}
