"""
数据库层包
提供数据库抽象接口和具体实现
"""
from .interface import DatabaseInterface


def get_database() -> DatabaseInterface:
    """
    根据配置返回相应的数据库实现

    开发环境: JSON 文件存储
    生产环境: MySQL/PostgreSQL
    """
    from config import Config

    db_type = getattr(Config, 'DATABASE_TYPE', 'json')

    if db_type == 'json':
        from .json_impl import JSONDatabase
        return JSONDatabase()

    elif db_type == 'mysql':
        from .mysql_impl import MySQLDatabase
        return MySQLDatabase()

    elif db_type == 'postgresql':
        from .postgresql_impl import PostgreSQLDatabase
        pg_config = getattr(Config, 'POSTGRESQL_CONFIG', {})
        return PostgreSQLDatabase(pg_config)

    else:
        raise ValueError(f"Unsupported database type: {db_type}")


__all__ = ['DatabaseInterface', 'get_database']
