package com.ruoyi.common.exception.user;

/**
 * 用户密码不正确
 * 
 * @author ruoyi
 */
public class UserPasswordErrorException extends UserException
{
    private static final long serialVersionUID = 1L;

    public UserPasswordErrorException()
    {
        super("user.password.error", null);
    }
}
