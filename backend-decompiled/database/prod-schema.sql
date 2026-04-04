-- MySQL dump 10.13  Distrib 5.7.44, for Linux (x86_64)
--
-- Host: localhost    Database: inter_stu_center
-- ------------------------------------------------------
-- Server version	5.7.44-log

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;

--
-- Table structure for table `activity`
--

DROP TABLE IF EXISTS `activity`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `activity` (
  `id` bigint(20) NOT NULL AUTO_INCREMENT COMMENT '主键',
  `name` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT '活动名称',
  `icon` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT '展示图',
  `start_time` datetime DEFAULT NULL COMMENT '活动开始时间',
  `end_time` datetime DEFAULT NULL COMMENT '活动结束时间',
  `address` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT '活动地点',
  `enrollment` int(11) DEFAULT NULL COMMENT '报名人数',
  `detail` text COLLATE utf8mb4_unicode_ci COMMENT '详情--富文本',
  `sign_start_time` datetime DEFAULT NULL COMMENT '报名开始时间',
  `sign_end_time` datetime DEFAULT NULL COMMENT '报名结束时间',
  `time_zone` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT '时区',
  `price` decimal(10,2) DEFAULT NULL COMMENT '价格',
  `price_unit` int(11) DEFAULT NULL COMMENT '费用单位。1-人民币   2-美元',
  `point` decimal(10,2) DEFAULT '0.00' COMMENT '活动可送积分',
  `act_type` int(11) DEFAULT NULL COMMENT '活动类型\r\n1- 社交活动 (Social) \r\n2- 节日庆典 (Festival) - 文化活动相关\r\n3- 生活服务 (Service) - 如接机\r\n4- 志愿服务 (Volunteer) - 积累志愿时长\r\n5- 学术活动 (Academic) \r\n6- 职业发展 (Career)',
  `model_id` bigint(20) DEFAULT NULL COMMENT '模板id',
  `model_name` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT '模板名',
  `model_content` text COLLATE utf8mb4_unicode_ci COMMENT '表单模板的内容',
  `status` int(11) DEFAULT NULL COMMENT '状态',
  `dept_ids` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT '活动相关的学校id，逗号分隔',
  `dept_id` bigint(20) DEFAULT NULL,
  `access_permission` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT '访问权限--角色keys数组',
  `share_point` decimal(10,2) DEFAULT '0.00' COMMENT '分享活动可获得积分',
  `enabled` int(11) DEFAULT NULL COMMENT '可用状态：  -1不可用     1-可用',
  `create_time` datetime DEFAULT NULL COMMENT '创建时间',
  `update_time` datetime DEFAULT NULL COMMENT '更新时间',
  `create_user_id` bigint(20) DEFAULT NULL COMMENT '创建用户的id',
  `create_name` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT '创建用户的名称',
  `create_nick_name` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT '创建用户的昵称/英文名',
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=48 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='活动表';
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `activity_ex_user`
--

DROP TABLE IF EXISTS `activity_ex_user`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `activity_ex_user` (
  `activity_id` bigint(20) DEFAULT NULL COMMENT '活动id',
  `user_id` bigint(20) DEFAULT NULL COMMENT '用户id',
  `sign_status` int(11) DEFAULT NULL COMMENT '签到状态（-1 未签到     1 已签到）',
  `model_form_info` text COLLATE utf8mb4_unicode_ci COMMENT '报名的表单数据',
  `status` int(11) DEFAULT '1' COMMENT '状态（-1待付款   1正常）',
  `share_user_id` bigint(11) DEFAULT NULL COMMENT '分享人user_id',
  `create_time` datetime DEFAULT NULL COMMENT '报名时间'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='报名表';
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `activity_model`
--

DROP TABLE IF EXISTS `activity_model`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `activity_model` (
  `id` bigint(20) NOT NULL AUTO_INCREMENT,
  `name` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT '活动模板名称',
  `content` text COLLATE utf8mb4_unicode_ci COMMENT '模板的表单内容',
  `create_time` datetime DEFAULT NULL COMMENT '创建时间',
  `update_time` datetime DEFAULT NULL COMMENT '更新时间',
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=23 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='活动模板';
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `activity_type`
--

DROP TABLE IF EXISTS `activity_type`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `activity_type` (
  `id` bigint(20) NOT NULL AUTO_INCREMENT,
  `name` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT '类型名称',
  `tag` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT '标识',
  `order_num` int(11) DEFAULT '0' COMMENT '显示顺序',
  `create_time` datetime DEFAULT NULL COMMENT '创建时间',
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=8 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='活动类型';
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `ai_chat_message`
--

DROP TABLE IF EXISTS `ai_chat_message`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `ai_chat_message` (
  `id` bigint(20) NOT NULL AUTO_INCREMENT COMMENT '消息ID',
  `message_id` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL COMMENT '消息唯一标识',
  `session_id` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL COMMENT '会话ID',
  `user_id` bigint(20) NOT NULL COMMENT '用户ID',
  `role` varchar(20) COLLATE utf8mb4_unicode_ci NOT NULL COMMENT '角色: user/assistant/system',
  `content` text COLLATE utf8mb4_unicode_ci NOT NULL COMMENT '消息内容',
  `rag_score` decimal(5,3) DEFAULT NULL COMMENT 'RAG检索分数',
  `source_type` varchar(30) COLLATE utf8mb4_unicode_ci DEFAULT 'knowledge_base' COMMENT '来源: knowledge_base/web_search',
  `create_time` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  PRIMARY KEY (`id`),
  UNIQUE KEY `message_id` (`message_id`) USING BTREE,
  KEY `idx_session` (`session_id`) USING BTREE,
  KEY `idx_user` (`user_id`) USING BTREE,
  KEY `idx_role` (`role`) USING BTREE,
  KEY `idx_create_time` (`create_time`) USING BTREE,
  CONSTRAINT `ai_chat_message_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `sys_user` (`user_id`) ON DELETE CASCADE,
  CONSTRAINT `ai_chat_message_ibfk_2` FOREIGN KEY (`session_id`) REFERENCES `ai_chat_session` (`session_id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=8 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='AI聊天消息表';
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `ai_chat_session`
--

DROP TABLE IF EXISTS `ai_chat_session`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `ai_chat_session` (
  `id` bigint(20) NOT NULL AUTO_INCREMENT COMMENT '会话ID',
  `session_id` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL COMMENT '会话唯一标识(UUID)',
  `user_id` bigint(20) NOT NULL COMMENT '用户ID',
  `dept_id` bigint(20) NOT NULL COMMENT '学校ID(部门ID)',
  `title` varchar(200) COLLATE utf8mb4_unicode_ci DEFAULT '新对话' COMMENT '对话标题',
  `create_time` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `update_time` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '更新时间',
  `del_flag` char(1) COLLATE utf8mb4_unicode_ci DEFAULT '0' COMMENT '删除标志(0存在 2删除)',
  PRIMARY KEY (`id`),
  UNIQUE KEY `session_id` (`session_id`) USING BTREE,
  KEY `idx_user` (`user_id`) USING BTREE,
  KEY `idx_dept` (`dept_id`) USING BTREE,
  KEY `idx_session` (`session_id`) USING BTREE,
  KEY `idx_create_time` (`create_time`) USING BTREE,
  KEY `idx_del_flag` (`del_flag`) USING BTREE,
  CONSTRAINT `ai_chat_session_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `sys_user` (`user_id`) ON DELETE CASCADE,
  CONSTRAINT `ai_chat_session_ibfk_2` FOREIGN KEY (`dept_id`) REFERENCES `sys_dept` (`dept_id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=9 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='AI聊天会话表';
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `ai_feedback`
--

DROP TABLE IF EXISTS `ai_feedback`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `ai_feedback` (
  `id` bigint(20) NOT NULL AUTO_INCREMENT COMMENT '反馈ID',
  `feedback_id` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL COMMENT '反馈唯一标识',
  `session_id` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL COMMENT '会话ID',
  `message_id` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL COMMENT '消息ID',
  `user_id` bigint(20) NOT NULL COMMENT '用户ID',
  `dept_id` bigint(20) NOT NULL COMMENT '学校ID',
  `question` text COLLATE utf8mb4_unicode_ci NOT NULL COMMENT '用户问题',
  `answer` text COLLATE utf8mb4_unicode_ci NOT NULL COMMENT 'AI回答',
  `rating` tinyint(4) NOT NULL COMMENT '评分: 1=有帮助, -1=没帮助',
  `rag_score` decimal(5,3) DEFAULT '0.000' COMMENT 'RAG检索分数',
  `source_type` varchar(30) COLLATE utf8mb4_unicode_ci DEFAULT 'knowledge_base' COMMENT '来源类型',
  `status` varchar(20) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'recorded' COMMENT '状态: recorded/pending/auto_approved/approved/rejected',
  `confidence_score` decimal(5,3) DEFAULT NULL COMMENT '置信度分数',
  `create_time` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `reviewed_time` datetime DEFAULT NULL COMMENT '审核时间',
  PRIMARY KEY (`id`),
  UNIQUE KEY `feedback_id` (`feedback_id`) USING BTREE,
  KEY `idx_session` (`session_id`) USING BTREE,
  KEY `idx_user` (`user_id`) USING BTREE,
  KEY `idx_dept` (`dept_id`) USING BTREE,
  KEY `idx_status` (`status`) USING BTREE,
  KEY `idx_rating` (`rating`) USING BTREE,
  KEY `idx_create_time` (`create_time`) USING BTREE,
  CONSTRAINT `ai_feedback_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `sys_user` (`user_id`) ON DELETE CASCADE,
  CONSTRAINT `ai_feedback_ibfk_2` FOREIGN KEY (`dept_id`) REFERENCES `sys_dept` (`dept_id`) ON DELETE CASCADE,
  CONSTRAINT `ai_feedback_ibfk_3` FOREIGN KEY (`session_id`) REFERENCES `ai_chat_session` (`session_id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=6 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='AI反馈表';
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `ai_knowledge_base`
--

DROP TABLE IF EXISTS `ai_knowledge_base`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `ai_knowledge_base` (
  `id` bigint(20) NOT NULL AUTO_INCREMENT COMMENT '知识库ID',
  `kb_id` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL COMMENT '知识库唯一标识',
  `question` text COLLATE utf8mb4_unicode_ci NOT NULL COMMENT '问题',
  `answer` text COLLATE utf8mb4_unicode_ci NOT NULL COMMENT '答案',
  `dept_id` bigint(20) NOT NULL COMMENT '学校ID',
  `category` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT '分类',
  `source` varchar(30) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'user_feedback' COMMENT '来源: user_feedback/manual/import',
  `feedback_id` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT '关联的反馈ID',
  `quality_score` decimal(5,3) DEFAULT '0.700' COMMENT '质量分数',
  `enabled` char(1) COLLATE utf8mb4_unicode_ci DEFAULT '1' COMMENT '是否启用(0否 1是)',
  `indexed` char(1) COLLATE utf8mb4_unicode_ci DEFAULT '0' COMMENT '是否已归档到向量索引(0否 1是)',
  `question_embedding` mediumtext COLLATE utf8mb4_unicode_ci,
  `create_time` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `update_time` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '更新时间',
  PRIMARY KEY (`id`),
  UNIQUE KEY `kb_id` (`kb_id`) USING BTREE,
  KEY `idx_dept` (`dept_id`) USING BTREE,
  KEY `idx_indexed` (`indexed`) USING BTREE,
  KEY `idx_enabled` (`enabled`) USING BTREE,
  KEY `idx_source` (`source`) USING BTREE,
  KEY `idx_create_time` (`create_time`) USING BTREE,
  KEY `feedback_id` (`feedback_id`) USING BTREE,
  CONSTRAINT `ai_knowledge_base_ibfk_1` FOREIGN KEY (`dept_id`) REFERENCES `sys_dept` (`dept_id`) ON DELETE CASCADE,
  CONSTRAINT `ai_knowledge_base_ibfk_2` FOREIGN KEY (`feedback_id`) REFERENCES `ai_feedback` (`feedback_id`) ON DELETE SET NULL
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='AI知识库表';
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `ai_normal_question`
--

DROP TABLE IF EXISTS `ai_normal_question`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `ai_normal_question` (
  `id` bigint(20) NOT NULL AUTO_INCREMENT,
  `message` text COLLATE utf8mb4_unicode_ci COMMENT '问题内容',
  `create_by_id` bigint(20) DEFAULT NULL COMMENT '创建人user_id',
  `create_by_name` varchar(200) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT '创建人legal_name',
  `create_time` datetime DEFAULT NULL COMMENT '创建时间',
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='AI常用问题';
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `coupon_verify_log`
--

DROP TABLE IF EXISTS `coupon_verify_log`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `coupon_verify_log` (
  `id` bigint(20) NOT NULL AUTO_INCREMENT,
  `user_coupon_id` bigint(20) DEFAULT NULL COMMENT '用户券id',
  `remark` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT '操作备注',
  `coupon_name` varchar(200) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT '券名称',
  `coupon_no` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT '券码',
  `user_id` bigint(20) DEFAULT NULL COMMENT '券所属用户id',
  `verify_by_id` bigint(20) DEFAULT NULL COMMENT '核销的商户的user_id',
  `verify_merchant_name` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT '核销的商户的名称',
  `create_time` datetime DEFAULT NULL COMMENT '核销时间',
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='券核销记录';
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `equity_data`
--

DROP TABLE IF EXISTS `equity_data`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `equity_data` (
  `id` bigint(20) NOT NULL AUTO_INCREMENT,
  `equ_name` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT '权益名称',
  `equ_tag` varchar(30) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT '权益标识',
  `equ_status` int(11) DEFAULT NULL COMMENT '启用状态：1-启用    -1-停用',
  `equ_sort` int(11) DEFAULT NULL COMMENT '排序',
  `create_time` datetime DEFAULT NULL COMMENT '创建时间',
  `update_time` datetime DEFAULT NULL COMMENT '更新时间',
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=6 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='核心权益管理';
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `gen_table`
--

DROP TABLE IF EXISTS `gen_table`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `gen_table` (
  `table_id` bigint(20) NOT NULL AUTO_INCREMENT COMMENT '编号',
  `table_name` varchar(200) COLLATE utf8mb4_unicode_ci DEFAULT '' COMMENT '表名称',
  `table_comment` varchar(500) COLLATE utf8mb4_unicode_ci DEFAULT '' COMMENT '表描述',
  `sub_table_name` varchar(64) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT '关联子表的表名',
  `sub_table_fk_name` varchar(64) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT '子表关联的外键名',
  `class_name` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT '' COMMENT '实体类名称',
  `tpl_category` varchar(200) COLLATE utf8mb4_unicode_ci DEFAULT 'crud' COMMENT '使用的模板（crud单表操作 tree树表操作）',
  `tpl_web_type` varchar(30) COLLATE utf8mb4_unicode_ci DEFAULT '' COMMENT '前端模板类型（element-ui模版 element-plus模版）',
  `package_name` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT '生成包路径',
  `module_name` varchar(30) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT '生成模块名',
  `business_name` varchar(30) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT '生成业务名',
  `function_name` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT '生成功能名',
  `function_author` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT '生成功能作者',
  `gen_type` char(1) COLLATE utf8mb4_unicode_ci DEFAULT '0' COMMENT '生成代码方式（0zip压缩包 1自定义路径）',
  `gen_path` varchar(200) COLLATE utf8mb4_unicode_ci DEFAULT '/' COMMENT '生成路径（不填默认项目路径）',
  `options` varchar(1000) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT '其它生成选项',
  `create_by` varchar(64) COLLATE utf8mb4_unicode_ci DEFAULT '' COMMENT '创建者',
  `create_time` datetime DEFAULT NULL COMMENT '创建时间',
  `update_by` varchar(64) COLLATE utf8mb4_unicode_ci DEFAULT '' COMMENT '更新者',
  `update_time` datetime DEFAULT NULL COMMENT '更新时间',
  `remark` varchar(500) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT '备注',
  PRIMARY KEY (`table_id`)
) ENGINE=InnoDB AUTO_INCREMENT=9 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='代码生成业务表';
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `gen_table_column`
--

DROP TABLE IF EXISTS `gen_table_column`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `gen_table_column` (
  `column_id` bigint(20) NOT NULL AUTO_INCREMENT COMMENT '编号',
  `table_id` bigint(20) DEFAULT NULL COMMENT '归属表编号',
  `column_name` varchar(200) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT '列名称',
  `column_comment` varchar(500) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT '列描述',
  `column_type` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT '列类型',
  `java_type` varchar(500) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT 'JAVA类型',
  `java_field` varchar(200) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT 'JAVA字段名',
  `is_pk` char(1) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT '是否主键（1是）',
  `is_increment` char(1) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT '是否自增（1是）',
  `is_required` char(1) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT '是否必填（1是）',
  `is_insert` char(1) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT '是否为插入字段（1是）',
  `is_edit` char(1) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT '是否编辑字段（1是）',
  `is_list` char(1) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT '是否列表字段（1是）',
  `is_query` char(1) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT '是否查询字段（1是）',
  `query_type` varchar(200) COLLATE utf8mb4_unicode_ci DEFAULT 'EQ' COMMENT '查询方式（等于、不等于、大于、小于、范围）',
  `html_type` varchar(200) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT '显示类型（文本框、文本域、下拉框、复选框、单选框、日期控件）',
  `dict_type` varchar(200) COLLATE utf8mb4_unicode_ci DEFAULT '' COMMENT '字典类型',
  `sort` int(11) DEFAULT NULL COMMENT '排序',
  `create_by` varchar(64) COLLATE utf8mb4_unicode_ci DEFAULT '' COMMENT '创建者',
  `create_time` datetime DEFAULT NULL COMMENT '创建时间',
  `update_by` varchar(64) COLLATE utf8mb4_unicode_ci DEFAULT '' COMMENT '更新者',
  `update_time` datetime DEFAULT NULL COMMENT '更新时间',
  PRIMARY KEY (`column_id`)
) ENGINE=InnoDB AUTO_INCREMENT=37 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='代码生成业务表字段';
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `invitation`
--

DROP TABLE IF EXISTS `invitation`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `invitation` (
  `id` bigint(20) NOT NULL AUTO_INCREMENT,
  `user_id` bigint(20) DEFAULT NULL COMMENT 'userId',
  `inv_code` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT '邀请码',
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=5 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='邀请码';
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `mall_classify`
--

DROP TABLE IF EXISTS `mall_classify`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `mall_classify` (
  `id` bigint(20) NOT NULL AUTO_INCREMENT,
  `cat_name` varchar(30) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT '分类名称',
  `cat_img` text COLLATE utf8mb4_unicode_ci COMMENT '分类图标',
  `create_time` datetime DEFAULT NULL COMMENT '创建时间',
  `create_by` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT '创建人',
  `update_time` datetime DEFAULT NULL COMMENT '更新时间',
  `update_by` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT '更新人',
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=11 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='商品分类';
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `mall_point_goods`
--

DROP TABLE IF EXISTS `mall_point_goods`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `mall_point_goods` (
  `id` bigint(20) NOT NULL AUTO_INCREMENT,
  `good_name` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT '商品名称',
  `good_icon` text COLLATE utf8mb4_unicode_ci COMMENT '商品展示图',
  `classify_id` bigint(20) DEFAULT NULL COMMENT '分类id',
  `good_desc` varchar(200) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT '商品简介',
  `price` decimal(10,0) DEFAULT NULL COMMENT '商品价格',
  `price_unit` int(255) DEFAULT NULL COMMENT '商品价格单位（1-积分   2-人民币    3-美元）',
  `quantity` bigint(20) DEFAULT NULL COMMENT '库存数量',
  `unit` varchar(20) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT '数量单位',
  `good_detail` text COLLATE utf8mb4_unicode_ci COMMENT '商品详情',
  `create_time` datetime DEFAULT NULL COMMENT '创建时间',
  `create_user_id` bigint(20) DEFAULT NULL COMMENT '创建用户id',
  `create_by` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT '创建人',
  `update_time` datetime DEFAULT NULL COMMENT '更新时间',
  `update_by` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT '更新人',
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=20 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='积分商品';
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `organization`
--

DROP TABLE IF EXISTS `organization`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `organization` (
  `id` bigint(20) NOT NULL AUTO_INCREMENT,
  `name` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT '组织名称',
  `create_time` datetime DEFAULT NULL COMMENT '创建时间',
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=6 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='组织';
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `plateform_data`
--

DROP TABLE IF EXISTS `plateform_data`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `plateform_data` (
  `id` bigint(20) NOT NULL AUTO_INCREMENT COMMENT '主键',
  `data_key` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT '内容key',
  `data_value` varchar(200) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT 'data值',
  `data_desc` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT 'data描述',
  `create_time` datetime DEFAULT NULL COMMENT '创建时间',
  `update_time` datetime DEFAULT NULL COMMENT '更新时间',
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='平台设置';
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `qrtz_blob_triggers`
--

DROP TABLE IF EXISTS `qrtz_blob_triggers`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `qrtz_blob_triggers` (
  `sched_name` varchar(120) COLLATE utf8mb4_unicode_ci NOT NULL COMMENT '调度名称',
  `trigger_name` varchar(200) COLLATE utf8mb4_unicode_ci NOT NULL COMMENT 'qrtz_triggers表trigger_name的外键',
  `trigger_group` varchar(200) COLLATE utf8mb4_unicode_ci NOT NULL COMMENT 'qrtz_triggers表trigger_group的外键',
  `blob_data` blob COMMENT '存放持久化Trigger对象',
  PRIMARY KEY (`sched_name`,`trigger_name`,`trigger_group`),
  CONSTRAINT `qrtz_blob_triggers_ibfk_1` FOREIGN KEY (`sched_name`, `trigger_name`, `trigger_group`) REFERENCES `qrtz_triggers` (`sched_name`, `trigger_name`, `trigger_group`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Blob类型的触发器表';
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `qrtz_calendars`
--

DROP TABLE IF EXISTS `qrtz_calendars`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `qrtz_calendars` (
  `sched_name` varchar(120) COLLATE utf8mb4_unicode_ci NOT NULL COMMENT '调度名称',
  `calendar_name` varchar(200) COLLATE utf8mb4_unicode_ci NOT NULL COMMENT '日历名称',
  `calendar` blob NOT NULL COMMENT '存放持久化calendar对象',
  PRIMARY KEY (`sched_name`,`calendar_name`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='日历信息表';
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `qrtz_cron_triggers`
--

DROP TABLE IF EXISTS `qrtz_cron_triggers`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `qrtz_cron_triggers` (
  `sched_name` varchar(120) COLLATE utf8mb4_unicode_ci NOT NULL COMMENT '调度名称',
  `trigger_name` varchar(200) COLLATE utf8mb4_unicode_ci NOT NULL COMMENT 'qrtz_triggers表trigger_name的外键',
  `trigger_group` varchar(200) COLLATE utf8mb4_unicode_ci NOT NULL COMMENT 'qrtz_triggers表trigger_group的外键',
  `cron_expression` varchar(200) COLLATE utf8mb4_unicode_ci NOT NULL COMMENT 'cron表达式',
  `time_zone_id` varchar(80) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT '时区',
  PRIMARY KEY (`sched_name`,`trigger_name`,`trigger_group`),
  CONSTRAINT `qrtz_cron_triggers_ibfk_1` FOREIGN KEY (`sched_name`, `trigger_name`, `trigger_group`) REFERENCES `qrtz_triggers` (`sched_name`, `trigger_name`, `trigger_group`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Cron类型的触发器表';
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `qrtz_fired_triggers`
--

DROP TABLE IF EXISTS `qrtz_fired_triggers`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `qrtz_fired_triggers` (
  `sched_name` varchar(120) COLLATE utf8mb4_unicode_ci NOT NULL COMMENT '调度名称',
  `entry_id` varchar(95) COLLATE utf8mb4_unicode_ci NOT NULL COMMENT '调度器实例id',
  `trigger_name` varchar(200) COLLATE utf8mb4_unicode_ci NOT NULL COMMENT 'qrtz_triggers表trigger_name的外键',
  `trigger_group` varchar(200) COLLATE utf8mb4_unicode_ci NOT NULL COMMENT 'qrtz_triggers表trigger_group的外键',
  `instance_name` varchar(200) COLLATE utf8mb4_unicode_ci NOT NULL COMMENT '调度器实例名',
  `fired_time` bigint(20) NOT NULL COMMENT '触发的时间',
  `sched_time` bigint(20) NOT NULL COMMENT '定时器制定的时间',
  `priority` int(11) NOT NULL COMMENT '优先级',
  `state` varchar(16) COLLATE utf8mb4_unicode_ci NOT NULL COMMENT '状态',
  `job_name` varchar(200) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT '任务名称',
  `job_group` varchar(200) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT '任务组名',
  `is_nonconcurrent` varchar(1) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT '是否并发',
  `requests_recovery` varchar(1) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT '是否接受恢复执行',
  PRIMARY KEY (`sched_name`,`entry_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='已触发的触发器表';
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `qrtz_job_details`
--

DROP TABLE IF EXISTS `qrtz_job_details`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `qrtz_job_details` (
  `sched_name` varchar(120) COLLATE utf8mb4_unicode_ci NOT NULL COMMENT '调度名称',
  `job_name` varchar(200) COLLATE utf8mb4_unicode_ci NOT NULL COMMENT '任务名称',
  `job_group` varchar(200) COLLATE utf8mb4_unicode_ci NOT NULL COMMENT '任务组名',
  `description` varchar(250) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT '相关介绍',
  `job_class_name` varchar(250) COLLATE utf8mb4_unicode_ci NOT NULL COMMENT '执行任务类名称',
  `is_durable` varchar(1) COLLATE utf8mb4_unicode_ci NOT NULL COMMENT '是否持久化',
  `is_nonconcurrent` varchar(1) COLLATE utf8mb4_unicode_ci NOT NULL COMMENT '是否并发',
  `is_update_data` varchar(1) COLLATE utf8mb4_unicode_ci NOT NULL COMMENT '是否更新数据',
  `requests_recovery` varchar(1) COLLATE utf8mb4_unicode_ci NOT NULL COMMENT '是否接受恢复执行',
  `job_data` blob COMMENT '存放持久化job对象',
  PRIMARY KEY (`sched_name`,`job_name`,`job_group`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='任务详细信息表';
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `qrtz_locks`
--

DROP TABLE IF EXISTS `qrtz_locks`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `qrtz_locks` (
  `sched_name` varchar(120) COLLATE utf8mb4_unicode_ci NOT NULL COMMENT '调度名称',
  `lock_name` varchar(40) COLLATE utf8mb4_unicode_ci NOT NULL COMMENT '悲观锁名称',
  PRIMARY KEY (`sched_name`,`lock_name`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='存储的悲观锁信息表';
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `qrtz_paused_trigger_grps`
--

DROP TABLE IF EXISTS `qrtz_paused_trigger_grps`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `qrtz_paused_trigger_grps` (
  `sched_name` varchar(120) COLLATE utf8mb4_unicode_ci NOT NULL COMMENT '调度名称',
  `trigger_group` varchar(200) COLLATE utf8mb4_unicode_ci NOT NULL COMMENT 'qrtz_triggers表trigger_group的外键',
  PRIMARY KEY (`sched_name`,`trigger_group`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='暂停的触发器表';
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `qrtz_scheduler_state`
--

DROP TABLE IF EXISTS `qrtz_scheduler_state`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `qrtz_scheduler_state` (
  `sched_name` varchar(120) COLLATE utf8mb4_unicode_ci NOT NULL COMMENT '调度名称',
  `instance_name` varchar(200) COLLATE utf8mb4_unicode_ci NOT NULL COMMENT '实例名称',
  `last_checkin_time` bigint(20) NOT NULL COMMENT '上次检查时间',
  `checkin_interval` bigint(20) NOT NULL COMMENT '检查间隔时间',
  PRIMARY KEY (`sched_name`,`instance_name`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='调度器状态表';
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `qrtz_simple_triggers`
--

DROP TABLE IF EXISTS `qrtz_simple_triggers`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `qrtz_simple_triggers` (
  `sched_name` varchar(120) COLLATE utf8mb4_unicode_ci NOT NULL COMMENT '调度名称',
  `trigger_name` varchar(200) COLLATE utf8mb4_unicode_ci NOT NULL COMMENT 'qrtz_triggers表trigger_name的外键',
  `trigger_group` varchar(200) COLLATE utf8mb4_unicode_ci NOT NULL COMMENT 'qrtz_triggers表trigger_group的外键',
  `repeat_count` bigint(20) NOT NULL COMMENT '重复的次数统计',
  `repeat_interval` bigint(20) NOT NULL COMMENT '重复的间隔时间',
  `times_triggered` bigint(20) NOT NULL COMMENT '已经触发的次数',
  PRIMARY KEY (`sched_name`,`trigger_name`,`trigger_group`),
  CONSTRAINT `qrtz_simple_triggers_ibfk_1` FOREIGN KEY (`sched_name`, `trigger_name`, `trigger_group`) REFERENCES `qrtz_triggers` (`sched_name`, `trigger_name`, `trigger_group`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='简单触发器的信息表';
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `qrtz_simprop_triggers`
--

DROP TABLE IF EXISTS `qrtz_simprop_triggers`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `qrtz_simprop_triggers` (
  `sched_name` varchar(120) COLLATE utf8mb4_unicode_ci NOT NULL COMMENT '调度名称',
  `trigger_name` varchar(200) COLLATE utf8mb4_unicode_ci NOT NULL COMMENT 'qrtz_triggers表trigger_name的外键',
  `trigger_group` varchar(200) COLLATE utf8mb4_unicode_ci NOT NULL COMMENT 'qrtz_triggers表trigger_group的外键',
  `str_prop_1` varchar(512) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT 'String类型的trigger的第一个参数',
  `str_prop_2` varchar(512) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT 'String类型的trigger的第二个参数',
  `str_prop_3` varchar(512) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT 'String类型的trigger的第三个参数',
  `int_prop_1` int(11) DEFAULT NULL COMMENT 'int类型的trigger的第一个参数',
  `int_prop_2` int(11) DEFAULT NULL COMMENT 'int类型的trigger的第二个参数',
  `long_prop_1` bigint(20) DEFAULT NULL COMMENT 'long类型的trigger的第一个参数',
  `long_prop_2` bigint(20) DEFAULT NULL COMMENT 'long类型的trigger的第二个参数',
  `dec_prop_1` decimal(13,4) DEFAULT NULL COMMENT 'decimal类型的trigger的第一个参数',
  `dec_prop_2` decimal(13,4) DEFAULT NULL COMMENT 'decimal类型的trigger的第二个参数',
  `bool_prop_1` varchar(1) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT 'Boolean类型的trigger的第一个参数',
  `bool_prop_2` varchar(1) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT 'Boolean类型的trigger的第二个参数',
  PRIMARY KEY (`sched_name`,`trigger_name`,`trigger_group`),
  CONSTRAINT `qrtz_simprop_triggers_ibfk_1` FOREIGN KEY (`sched_name`, `trigger_name`, `trigger_group`) REFERENCES `qrtz_triggers` (`sched_name`, `trigger_name`, `trigger_group`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='同步机制的行锁表';
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `qrtz_triggers`
--

DROP TABLE IF EXISTS `qrtz_triggers`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `qrtz_triggers` (
  `sched_name` varchar(120) COLLATE utf8mb4_unicode_ci NOT NULL COMMENT '调度名称',
  `trigger_name` varchar(200) COLLATE utf8mb4_unicode_ci NOT NULL COMMENT '触发器的名字',
  `trigger_group` varchar(200) COLLATE utf8mb4_unicode_ci NOT NULL COMMENT '触发器所属组的名字',
  `job_name` varchar(200) COLLATE utf8mb4_unicode_ci NOT NULL COMMENT 'qrtz_job_details表job_name的外键',
  `job_group` varchar(200) COLLATE utf8mb4_unicode_ci NOT NULL COMMENT 'qrtz_job_details表job_group的外键',
  `description` varchar(250) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT '相关介绍',
  `next_fire_time` bigint(20) DEFAULT NULL COMMENT '上一次触发时间（毫秒）',
  `prev_fire_time` bigint(20) DEFAULT NULL COMMENT '下一次触发时间（默认为-1表示不触发）',
  `priority` int(11) DEFAULT NULL COMMENT '优先级',
  `trigger_state` varchar(16) COLLATE utf8mb4_unicode_ci NOT NULL COMMENT '触发器状态',
  `trigger_type` varchar(8) COLLATE utf8mb4_unicode_ci NOT NULL COMMENT '触发器的类型',
  `start_time` bigint(20) NOT NULL COMMENT '开始时间',
  `end_time` bigint(20) DEFAULT NULL COMMENT '结束时间',
  `calendar_name` varchar(200) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT '日程表名称',
  `misfire_instr` smallint(6) DEFAULT NULL COMMENT '补偿执行的策略',
  `job_data` blob COMMENT '存放持久化job对象',
  PRIMARY KEY (`sched_name`,`trigger_name`,`trigger_group`),
  KEY `sched_name` (`sched_name`,`job_name`,`job_group`) USING BTREE,
  CONSTRAINT `qrtz_triggers_ibfk_1` FOREIGN KEY (`sched_name`, `job_name`, `job_group`) REFERENCES `qrtz_job_details` (`sched_name`, `job_name`, `job_group`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='触发器详细信息表';
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `sys_config`
--

DROP TABLE IF EXISTS `sys_config`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `sys_config` (
  `config_id` int(11) NOT NULL AUTO_INCREMENT COMMENT '参数主键',
  `config_name` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT '' COMMENT '参数名称',
  `config_key` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT '' COMMENT '参数键名',
  `config_value` varchar(500) COLLATE utf8mb4_unicode_ci DEFAULT '' COMMENT '参数键值',
  `config_type` char(1) COLLATE utf8mb4_unicode_ci DEFAULT 'N' COMMENT '系统内置（Y是 N否）',
  `create_by` varchar(64) COLLATE utf8mb4_unicode_ci DEFAULT '' COMMENT '创建者',
  `create_time` datetime DEFAULT NULL COMMENT '创建时间',
  `update_by` varchar(64) COLLATE utf8mb4_unicode_ci DEFAULT '' COMMENT '更新者',
  `update_time` datetime DEFAULT NULL COMMENT '更新时间',
  `remark` varchar(500) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT '备注',
  PRIMARY KEY (`config_id`)
) ENGINE=InnoDB AUTO_INCREMENT=9 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='参数配置表';
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `sys_coupon`
--

DROP TABLE IF EXISTS `sys_coupon`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `sys_coupon` (
  `id` bigint(20) NOT NULL AUTO_INCREMENT,
  `coupon_name` varchar(200) COLLATE utf8mb4_unicode_ci NOT NULL COMMENT '券名称',
  `coupon_type` int(11) NOT NULL COMMENT '券类型（1-代金券）',
  `coupon_price` decimal(10,2) DEFAULT NULL COMMENT '券金额',
  `coupon_no` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT '券码',
  `coupon_limit` decimal(10,2) DEFAULT NULL COMMENT '使用门槛（0-无门槛）',
  `coupon_rules` text COLLATE utf8mb4_unicode_ci COMMENT '优惠券使用规则',
  `valid_from` datetime DEFAULT NULL COMMENT '有效期开始时间',
  `valid_end` datetime DEFAULT NULL COMMENT '有效期结束时间',
  `quantity` bigint(20) DEFAULT '0' COMMENT '库存数量',
  `status` int(11) DEFAULT NULL COMMENT '状态（-1-待审核    1-审核通过     2-审核拒绝    3-已过期）',
  `remark` text COLLATE utf8mb4_unicode_ci COMMENT '备注-拒绝原因',
  `source_from` int(11) DEFAULT NULL COMMENT '来源（1-商家    2-平台）',
  `purpose` int(11) DEFAULT NULL COMMENT '适用范围（1-全部门店     2-指定门店）',
  `purpose_merchant_user_id` text COLLATE utf8mb4_unicode_ci COMMENT '可用门店的user_id',
  `create_by_user_id` bigint(20) DEFAULT NULL COMMENT '创建人user_id',
  `create_by_name` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT '创建人（商家-商家名称       平台-legal_name）',
  `create_time` datetime DEFAULT NULL COMMENT '创建时间',
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=13 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='优惠券';
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `sys_dept`
--

DROP TABLE IF EXISTS `sys_dept`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `sys_dept` (
  `dept_id` bigint(20) NOT NULL AUTO_INCREMENT COMMENT '部门id',
  `parent_id` bigint(20) DEFAULT '0' COMMENT '父部门id',
  `ancestors` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT '' COMMENT '祖级列表',
  `dept_name` varchar(30) COLLATE utf8mb4_unicode_ci DEFAULT '' COMMENT '部门名称',
  `order_num` int(11) DEFAULT '0' COMMENT '显示顺序',
  `leader` varchar(20) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT '负责人',
  `phone` varchar(11) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT '联系电话',
  `email` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT '邮箱',
  `status` char(1) COLLATE utf8mb4_unicode_ci DEFAULT '0' COMMENT '部门状态（0正常 1停用）',
  `del_flag` char(1) COLLATE utf8mb4_unicode_ci DEFAULT '0' COMMENT '删除标志（0代表存在 2代表删除）',
  `create_by` varchar(64) COLLATE utf8mb4_unicode_ci DEFAULT '' COMMENT '创建者',
  `create_time` datetime DEFAULT NULL COMMENT '创建时间',
  `update_by` varchar(64) COLLATE utf8mb4_unicode_ci DEFAULT '' COMMENT '更新者',
  `update_time` datetime DEFAULT NULL COMMENT '更新时间',
  `logo` text COLLATE utf8mb4_unicode_ci,
  `eng_name` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT '英文名称',
  `apr_name` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT '简称',
  `mail_domain` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT '邮箱后缀',
  `detail` text COLLATE utf8mb4_unicode_ci COMMENT '学校介绍',
  PRIMARY KEY (`dept_id`)
) ENGINE=InnoDB AUTO_INCREMENT=231 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='部门表';
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `sys_dict_data`
--

DROP TABLE IF EXISTS `sys_dict_data`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `sys_dict_data` (
  `dict_code` bigint(20) NOT NULL AUTO_INCREMENT COMMENT '字典编码',
  `dict_sort` int(11) DEFAULT '0' COMMENT '字典排序',
  `dict_label` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT '' COMMENT '字典标签',
  `dict_value` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT '' COMMENT '字典键值',
  `dict_type` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT '' COMMENT '字典类型',
  `css_class` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT '样式属性（其他样式扩展）',
  `list_class` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT '表格回显样式',
  `is_default` char(1) COLLATE utf8mb4_unicode_ci DEFAULT 'N' COMMENT '是否默认（Y是 N否）',
  `status` char(1) COLLATE utf8mb4_unicode_ci DEFAULT '0' COMMENT '状态（0正常 1停用）',
  `create_by` varchar(64) COLLATE utf8mb4_unicode_ci DEFAULT '' COMMENT '创建者',
  `create_time` datetime DEFAULT NULL COMMENT '创建时间',
  `update_by` varchar(64) COLLATE utf8mb4_unicode_ci DEFAULT '' COMMENT '更新者',
  `update_time` datetime DEFAULT NULL COMMENT '更新时间',
  `remark` varchar(500) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT '备注',
  PRIMARY KEY (`dict_code`)
) ENGINE=InnoDB AUTO_INCREMENT=30 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='字典数据表';
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `sys_dict_type`
--

DROP TABLE IF EXISTS `sys_dict_type`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `sys_dict_type` (
  `dict_id` bigint(20) NOT NULL AUTO_INCREMENT COMMENT '字典主键',
  `dict_name` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT '' COMMENT '字典名称',
  `dict_type` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT '' COMMENT '字典类型',
  `status` char(1) COLLATE utf8mb4_unicode_ci DEFAULT '0' COMMENT '状态（0正常 1停用）',
  `create_by` varchar(64) COLLATE utf8mb4_unicode_ci DEFAULT '' COMMENT '创建者',
  `create_time` datetime DEFAULT NULL COMMENT '创建时间',
  `update_by` varchar(64) COLLATE utf8mb4_unicode_ci DEFAULT '' COMMENT '更新者',
  `update_time` datetime DEFAULT NULL COMMENT '更新时间',
  `remark` varchar(500) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT '备注',
  PRIMARY KEY (`dict_id`),
  UNIQUE KEY `dict_type` (`dict_type`) USING BTREE
) ENGINE=InnoDB AUTO_INCREMENT=11 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='字典类型表';
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `sys_job`
--

DROP TABLE IF EXISTS `sys_job`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `sys_job` (
  `job_id` bigint(20) NOT NULL AUTO_INCREMENT COMMENT '任务ID',
  `job_name` varchar(64) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT '' COMMENT '任务名称',
  `job_group` varchar(64) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'DEFAULT' COMMENT '任务组名',
  `invoke_target` varchar(500) COLLATE utf8mb4_unicode_ci NOT NULL COMMENT '调用目标字符串',
  `cron_expression` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT '' COMMENT 'cron执行表达式',
  `misfire_policy` varchar(20) COLLATE utf8mb4_unicode_ci DEFAULT '3' COMMENT '计划执行错误策略（1立即执行 2执行一次 3放弃执行）',
  `concurrent` char(1) COLLATE utf8mb4_unicode_ci DEFAULT '1' COMMENT '是否并发执行（0允许 1禁止）',
  `status` char(1) COLLATE utf8mb4_unicode_ci DEFAULT '0' COMMENT '状态（0正常 1暂停）',
  `create_by` varchar(64) COLLATE utf8mb4_unicode_ci DEFAULT '' COMMENT '创建者',
  `create_time` datetime DEFAULT NULL COMMENT '创建时间',
  `update_by` varchar(64) COLLATE utf8mb4_unicode_ci DEFAULT '' COMMENT '更新者',
  `update_time` datetime DEFAULT NULL COMMENT '更新时间',
  `remark` varchar(500) COLLATE utf8mb4_unicode_ci DEFAULT '' COMMENT '备注信息',
  PRIMARY KEY (`job_id`,`job_name`,`job_group`)
) ENGINE=InnoDB AUTO_INCREMENT=7 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='定时任务调度表';
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `sys_job_log`
--

DROP TABLE IF EXISTS `sys_job_log`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `sys_job_log` (
  `job_log_id` bigint(20) NOT NULL AUTO_INCREMENT COMMENT '任务日志ID',
  `job_name` varchar(64) COLLATE utf8mb4_unicode_ci NOT NULL COMMENT '任务名称',
  `job_group` varchar(64) COLLATE utf8mb4_unicode_ci NOT NULL COMMENT '任务组名',
  `invoke_target` varchar(500) COLLATE utf8mb4_unicode_ci NOT NULL COMMENT '调用目标字符串',
  `job_message` varchar(500) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT '日志信息',
  `status` char(1) COLLATE utf8mb4_unicode_ci DEFAULT '0' COMMENT '执行状态（0正常 1失败）',
  `exception_info` varchar(2000) COLLATE utf8mb4_unicode_ci DEFAULT '' COMMENT '异常信息',
  `create_time` datetime DEFAULT NULL COMMENT '创建时间',
  PRIMARY KEY (`job_log_id`)
) ENGINE=InnoDB AUTO_INCREMENT=445060 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='定时任务调度日志表';
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `sys_logininfor`
--

DROP TABLE IF EXISTS `sys_logininfor`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `sys_logininfor` (
  `info_id` bigint(20) NOT NULL AUTO_INCREMENT COMMENT '访问ID',
  `user_name` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT '' COMMENT '用户账号',
  `ipaddr` varchar(128) COLLATE utf8mb4_unicode_ci DEFAULT '' COMMENT '登录IP地址',
  `login_location` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT '' COMMENT '登录地点',
  `browser` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT '' COMMENT '浏览器类型',
  `os` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT '' COMMENT '操作系统',
  `status` char(1) COLLATE utf8mb4_unicode_ci DEFAULT '0' COMMENT '登录状态（0成功 1失败）',
  `msg` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT '' COMMENT '提示消息',
  `login_time` datetime DEFAULT NULL COMMENT '访问时间',
  PRIMARY KEY (`info_id`),
  KEY `idx_sys_logininfor_s` (`status`) USING BTREE,
  KEY `idx_sys_logininfor_lt` (`login_time`) USING BTREE
) ENGINE=InnoDB AUTO_INCREMENT=3211 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='系统访问记录';
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `sys_menu`
--

DROP TABLE IF EXISTS `sys_menu`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `sys_menu` (
  `menu_id` bigint(20) NOT NULL AUTO_INCREMENT COMMENT '菜单ID',
  `menu_name` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL COMMENT '菜单名称',
  `parent_id` bigint(20) DEFAULT '0' COMMENT '父菜单ID',
  `order_num` int(11) DEFAULT '0' COMMENT '显示顺序',
  `path` varchar(200) COLLATE utf8mb4_unicode_ci DEFAULT '' COMMENT '路由地址',
  `component` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT '组件路径',
  `query` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT '路由参数',
  `route_name` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT '' COMMENT '路由名称',
  `is_frame` int(11) DEFAULT '1' COMMENT '是否为外链（0是 1否）',
  `is_cache` int(11) DEFAULT '0' COMMENT '是否缓存（0缓存 1不缓存）',
  `menu_type` char(1) COLLATE utf8mb4_unicode_ci DEFAULT '' COMMENT '菜单类型（M目录 C菜单 F按钮）',
  `visible` char(1) COLLATE utf8mb4_unicode_ci DEFAULT '0' COMMENT '菜单状态（0显示 1隐藏）',
  `status` char(1) COLLATE utf8mb4_unicode_ci DEFAULT '0' COMMENT '菜单状态（0正常 1停用）',
  `perms` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT '权限标识',
  `icon` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT '#' COMMENT '菜单图标',
  `create_by` varchar(64) COLLATE utf8mb4_unicode_ci DEFAULT '' COMMENT '创建者',
  `create_time` datetime DEFAULT NULL COMMENT '创建时间',
  `update_by` varchar(64) COLLATE utf8mb4_unicode_ci DEFAULT '' COMMENT '更新者',
  `update_time` datetime DEFAULT NULL COMMENT '更新时间',
  `remark` varchar(500) COLLATE utf8mb4_unicode_ci DEFAULT '' COMMENT '备注',
  PRIMARY KEY (`menu_id`)
) ENGINE=InnoDB AUTO_INCREMENT=2157 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='菜单权限表';
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `sys_notice`
--

DROP TABLE IF EXISTS `sys_notice`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `sys_notice` (
  `notice_id` int(11) NOT NULL AUTO_INCREMENT COMMENT '公告ID',
  `notice_title` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL COMMENT '公告标题',
  `notice_type` char(1) COLLATE utf8mb4_unicode_ci NOT NULL COMMENT '公告类型（1通知 2公告）',
  `notice_content` longblob COMMENT '公告内容',
  `status` char(1) COLLATE utf8mb4_unicode_ci DEFAULT '0' COMMENT '公告状态（0正常 1关闭）',
  `create_by` varchar(64) COLLATE utf8mb4_unicode_ci DEFAULT '' COMMENT '创建者',
  `create_time` datetime DEFAULT NULL COMMENT '创建时间',
  `update_by` varchar(64) COLLATE utf8mb4_unicode_ci DEFAULT '' COMMENT '更新者',
  `update_time` datetime DEFAULT NULL COMMENT '更新时间',
  `remark` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT '备注',
  PRIMARY KEY (`notice_id`)
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='通知公告表';
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `sys_oper_log`
--

DROP TABLE IF EXISTS `sys_oper_log`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `sys_oper_log` (
  `oper_id` bigint(20) NOT NULL AUTO_INCREMENT COMMENT '日志主键',
  `title` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT '' COMMENT '模块标题',
  `business_type` int(11) DEFAULT '0' COMMENT '业务类型（0其它 1新增 2修改 3删除）',
  `method` varchar(200) COLLATE utf8mb4_unicode_ci DEFAULT '' COMMENT '方法名称',
  `request_method` varchar(10) COLLATE utf8mb4_unicode_ci DEFAULT '' COMMENT '请求方式',
  `operator_type` int(11) DEFAULT '0' COMMENT '操作类别（0其它 1后台用户 2手机端用户）',
  `oper_name` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT '' COMMENT '操作人员',
  `dept_name` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT '' COMMENT '部门名称',
  `oper_url` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT '' COMMENT '请求URL',
  `oper_ip` varchar(128) COLLATE utf8mb4_unicode_ci DEFAULT '' COMMENT '主机地址',
  `oper_location` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT '' COMMENT '操作地点',
  `oper_param` varchar(2000) COLLATE utf8mb4_unicode_ci DEFAULT '' COMMENT '请求参数',
  `json_result` varchar(2000) COLLATE utf8mb4_unicode_ci DEFAULT '' COMMENT '返回参数',
  `status` int(11) DEFAULT '0' COMMENT '操作状态（0正常 1异常）',
  `error_msg` varchar(2000) COLLATE utf8mb4_unicode_ci DEFAULT '' COMMENT '错误消息',
  `oper_time` datetime DEFAULT NULL COMMENT '操作时间',
  `cost_time` bigint(20) DEFAULT '0' COMMENT '消耗时间',
  PRIMARY KEY (`oper_id`),
  KEY `idx_sys_oper_log_bt` (`business_type`) USING BTREE,
  KEY `idx_sys_oper_log_s` (`status`) USING BTREE,
  KEY `idx_sys_oper_log_ot` (`oper_time`) USING BTREE
) ENGINE=InnoDB AUTO_INCREMENT=1175 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='操作日志记录';
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `sys_order`
--

DROP TABLE IF EXISTS `sys_order`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `sys_order` (
  `id` bigint(20) NOT NULL AUTO_INCREMENT COMMENT '主键',
  `title` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT '标题',
  `goods_id` bigint(20) DEFAULT NULL COMMENT '积分商品表的id',
  `activity_id` bigint(20) DEFAULT NULL COMMENT '活动id',
  `addr_id` bigint(20) DEFAULT NULL COMMENT '收货地址的id',
  `order_no` varchar(40) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT '订单编号',
  `order_status` int(11) DEFAULT NULL COMMENT '订单状态（1-待支付   2-已完成    3-已取消     4-已退款   5-待发货   6-待收货）',
  `order_type` int(11) DEFAULT NULL COMMENT '订单类型（1-积分商城消费   2-活动支付    3-会员等级支付）',
  `pay_mode` int(11) DEFAULT '1' COMMENT '消费方式（1-金额   2-积分）改为 （1-美元   2-积分   3-人民币）',
  `order_desc` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT '订单描述',
  `price` decimal(10,2) DEFAULT NULL COMMENT '订单金额',
  `num` int(11) DEFAULT NULL COMMENT '数量',
  `receiving_name` varchar(200) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT '收货人姓名',
  `receiving_mobile` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT '收件人手机号',
  `receiving_address` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT '收货地址',
  `int_area_code` varchar(20) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT '国家代码',
  `longitude` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT '经度',
  `latitude` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT '纬度',
  `tracking_number` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT '物流单号',
  `logistics_company` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT '物流公司名',
  `remark` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT '备注',
  `cancel_reason` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT '取消/退款原因',
  `order_str` text COLLATE utf8mb4_unicode_ci COMMENT '订单签名字符串，支付宝返回',
  `pay_channel` int(11) DEFAULT NULL COMMENT '支付途径（1-支付宝）',
  `create_by_id` bigint(20) DEFAULT NULL COMMENT '订单创建者的user_id',
  `create_by_name` varchar(200) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT '订单创建者的legal_name',
  `create_time` datetime DEFAULT NULL COMMENT '创建时间',
  `pay_time` datetime DEFAULT NULL COMMENT '支付时间',
  `refund_time` datetime DEFAULT NULL COMMENT '退款时间',
  `cancel_time` datetime DEFAULT NULL COMMENT '关闭/取消时间',
  `client_secret` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT 'Stripe支付参数client_secret',
  `payment_intent_id` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT 'Stripe支付参数payment_intent_id',
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=21 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='订单';
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `sys_post`
--

DROP TABLE IF EXISTS `sys_post`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `sys_post` (
  `post_id` bigint(20) NOT NULL AUTO_INCREMENT COMMENT '岗位ID',
  `post_code` varchar(64) COLLATE utf8mb4_unicode_ci NOT NULL COMMENT '岗位编码',
  `post_name` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL COMMENT '岗位名称',
  `post_sort` int(11) NOT NULL COMMENT '显示顺序',
  `status` char(1) COLLATE utf8mb4_unicode_ci NOT NULL COMMENT '状态（0正常 1停用）',
  `create_by` varchar(64) COLLATE utf8mb4_unicode_ci DEFAULT '' COMMENT '创建者',
  `create_time` datetime DEFAULT NULL COMMENT '创建时间',
  `update_by` varchar(64) COLLATE utf8mb4_unicode_ci DEFAULT '' COMMENT '更新者',
  `update_time` datetime DEFAULT NULL COMMENT '更新时间',
  `remark` varchar(500) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT '备注',
  PRIMARY KEY (`post_id`)
) ENGINE=InnoDB AUTO_INCREMENT=10 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='岗位信息表';
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `sys_role`
--

DROP TABLE IF EXISTS `sys_role`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `sys_role` (
  `role_id` bigint(20) NOT NULL AUTO_INCREMENT COMMENT '角色ID',
  `role_name` varchar(30) COLLATE utf8mb4_unicode_ci NOT NULL COMMENT '角色名称',
  `role_key` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL COMMENT '角色权限字符串',
  `role_sort` int(11) NOT NULL COMMENT '显示顺序',
  `data_scope` char(1) COLLATE utf8mb4_unicode_ci DEFAULT '1' COMMENT '数据范围（1：全部数据权限 2：自定数据权限 3：本部门数据权限 4：本部门及以下数据权限）',
  `menu_check_strictly` tinyint(1) DEFAULT '1' COMMENT '菜单树选择项是否关联显示',
  `dept_check_strictly` tinyint(1) DEFAULT '1' COMMENT '部门树选择项是否关联显示',
  `status` char(1) COLLATE utf8mb4_unicode_ci NOT NULL COMMENT '角色状态（0正常 1停用）',
  `del_flag` char(1) COLLATE utf8mb4_unicode_ci DEFAULT '0' COMMENT '删除标志（0代表存在 2代表删除）',
  `create_by` varchar(64) COLLATE utf8mb4_unicode_ci DEFAULT '' COMMENT '创建者',
  `create_time` datetime DEFAULT NULL COMMENT '创建时间',
  `update_by` varchar(64) COLLATE utf8mb4_unicode_ci DEFAULT '' COMMENT '更新者',
  `update_time` datetime DEFAULT NULL COMMENT '更新时间',
  `remark` varchar(500) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT '备注',
  `is_selected` int(11) DEFAULT NULL COMMENT '用户是否可以主动选择（-1：不能     1：能）',
  PRIMARY KEY (`role_id`)
) ENGINE=InnoDB AUTO_INCREMENT=104 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='角色信息表';
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `sys_role_dept`
--

DROP TABLE IF EXISTS `sys_role_dept`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `sys_role_dept` (
  `role_id` bigint(20) NOT NULL COMMENT '角色ID',
  `dept_id` bigint(20) NOT NULL COMMENT '部门ID',
  PRIMARY KEY (`role_id`,`dept_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='角色和部门关联表';
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `sys_role_menu`
--

DROP TABLE IF EXISTS `sys_role_menu`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `sys_role_menu` (
  `role_id` bigint(20) NOT NULL COMMENT '角色ID',
  `menu_id` bigint(20) NOT NULL COMMENT '菜单ID',
  PRIMARY KEY (`role_id`,`menu_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='角色和菜单关联表';
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `sys_user`
--

DROP TABLE IF EXISTS `sys_user`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `sys_user` (
  `user_id` bigint(20) NOT NULL AUTO_INCREMENT COMMENT '用户ID',
  `dept_id` bigint(20) DEFAULT NULL COMMENT '部门ID',
  `user_name` varchar(40) COLLATE utf8mb4_unicode_ci NOT NULL COMMENT '用户账号',
  `legal_name` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT '法定姓名',
  `nick_name` varchar(30) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT '用户昵称',
  `user_type` varchar(2) COLLATE utf8mb4_unicode_ci DEFAULT '00' COMMENT '用户类型（00系统用户）',
  `email` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT '' COMMENT '用户邮箱',
  `is_email_verify` int(20) DEFAULT '-1' COMMENT '邮箱是否验证（-1否     1是）',
  `phonenumber` varchar(11) COLLATE utf8mb4_unicode_ci DEFAULT '' COMMENT '手机号码',
  `sex` char(1) COLLATE utf8mb4_unicode_ci DEFAULT '0' COMMENT '用户性别（0男 1女 2未知）',
  `avatar` text COLLATE utf8mb4_unicode_ci COMMENT '头像地址',
  `password` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT '' COMMENT '密码',
  `status` char(1) COLLATE utf8mb4_unicode_ci DEFAULT '0' COMMENT '账号状态（0正常 1停用）',
  `del_flag` char(1) COLLATE utf8mb4_unicode_ci DEFAULT '0' COMMENT '删除标志（0代表存在 2代表删除）',
  `login_ip` varchar(128) COLLATE utf8mb4_unicode_ci DEFAULT '' COMMENT '最后登录IP',
  `login_date` datetime DEFAULT NULL COMMENT '最后登录时间',
  `pwd_update_date` datetime DEFAULT NULL COMMENT '密码最后更新时间',
  `create_by` varchar(64) COLLATE utf8mb4_unicode_ci DEFAULT '' COMMENT '创建者',
  `create_time` datetime DEFAULT NULL COMMENT '创建时间',
  `update_by` varchar(64) COLLATE utf8mb4_unicode_ci DEFAULT '' COMMENT '更新者',
  `update_time` datetime DEFAULT NULL COMMENT '更新时间',
  `remark` varchar(500) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT '备注',
  `org_id` bigint(20) DEFAULT NULL COMMENT '组织表id',
  `area` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT '国家区域',
  `int_area_code` varchar(20) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT '国际电话区号',
  `is_merchant` int(255) DEFAULT '-1' COMMENT '用户是否是商户（1：是      -1：不是）',
  `identity` int(11) DEFAULT '1' COMMENT '身份（1-学生   2-家长  3-其他）',
  `alternate_email` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT '备用邮箱',
  `refer_user_id` bigint(11) DEFAULT NULL COMMENT '推荐人userId',
  PRIMARY KEY (`user_id`)
) ENGINE=InnoDB AUTO_INCREMENT=1290 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='用户信息表';
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `sys_user_address`
--

DROP TABLE IF EXISTS `sys_user_address`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `sys_user_address` (
  `id` bigint(20) NOT NULL AUTO_INCREMENT,
  `name` varchar(200) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT '收件人姓名',
  `int_area_code` varchar(20) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT '国家代码',
  `mobile` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT '收件人号码',
  `address` text COLLATE utf8mb4_unicode_ci COMMENT '地址',
  `detail_addr` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT '详细地址',
  `longitude` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT '经度',
  `latitude` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT '纬度',
  `is_default` int(11) DEFAULT '-1' COMMENT '是否默认地址（-1-否   1-是）',
  `create_by_id` bigint(20) DEFAULT NULL COMMENT '创建用户的user_id',
  `create_by_name` varchar(200) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT '创建用户的法定姓名',
  `create_time` datetime DEFAULT NULL COMMENT '创建时间',
  `update_time` datetime DEFAULT NULL COMMENT '更新时间',
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=8 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='收货地址';
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `sys_user_ex_coupon`
--

DROP TABLE IF EXISTS `sys_user_ex_coupon`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `sys_user_ex_coupon` (
  `id` bigint(20) NOT NULL AUTO_INCREMENT,
  `coupon_id` bigint(20) DEFAULT NULL COMMENT '券表id',
  `user_id` bigint(20) DEFAULT NULL COMMENT '用户user_id',
  `coupon_name` varchar(200) COLLATE utf8mb4_unicode_ci NOT NULL COMMENT '券名称',
  `coupon_type` int(11) NOT NULL COMMENT '券类型（1-代金券）',
  `coupon_price` decimal(10,2) DEFAULT NULL COMMENT '券金额',
  `coupon_no` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT '券码',
  `coupon_limit` decimal(10,2) DEFAULT NULL COMMENT '使用门槛（0-无门槛）',
  `coupon_rules` text COLLATE utf8mb4_unicode_ci COMMENT '优惠券使用规则',
  `valid_from` datetime DEFAULT NULL COMMENT '有效期开始时间',
  `valid_end` datetime DEFAULT NULL COMMENT '有效期结束时间',
  `quantity` bigint(20) DEFAULT '1' COMMENT '数量，用户的数量都是1',
  `status` int(11) DEFAULT NULL COMMENT '状态（-1-已使用  1-可用   2-已过期）',
  `source_from` int(11) DEFAULT NULL COMMENT '来源（1-商家    2-平台）',
  `purpose` int(11) DEFAULT NULL COMMENT '适用范围（1-全部门店     2-指定门店）',
  `purpose_merchant_user_id` text COLLATE utf8mb4_unicode_ci COMMENT '可用门店的user_id',
  `create_by_user_id` bigint(20) DEFAULT NULL COMMENT '创建人user_id',
  `create_by_name` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT '创建人（商家-商家名称       平台-legal_name）',
  `create_time` datetime DEFAULT NULL COMMENT '创建时间-此处是券分配的时间',
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=14 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='用户关联优惠券';
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `sys_user_ex_level`
--

DROP TABLE IF EXISTS `sys_user_ex_level`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `sys_user_ex_level` (
  `id` bigint(20) NOT NULL AUTO_INCREMENT,
  `user_id` bigint(20) DEFAULT NULL COMMENT '用户表user_id',
  `level_id` bigint(20) DEFAULT NULL COMMENT '会员等级表level_id',
  `validity_type` int(11) DEFAULT '1' COMMENT '会员等级时效性（1-永久    -1-临时）',
  `status` int(11) DEFAULT '1' COMMENT '状态（1-正常   -1-失效）',
  `validity_start_time` datetime DEFAULT NULL COMMENT '有效期起始时间',
  `validity_end_time` datetime DEFAULT NULL COMMENT '有效期结束时间',
  `create_time` datetime DEFAULT NULL COMMENT '记录创建时间',
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=17 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='用户对应会员等级';
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `sys_user_level`
--

DROP TABLE IF EXISTS `sys_user_level`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `sys_user_level` (
  `id` bigint(20) NOT NULL AUTO_INCREMENT,
  `level_name` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT '等级名称',
  `logo` text COLLATE utf8mb4_unicode_ci,
  `member_benefits` text COLLATE utf8mb4_unicode_ci COMMENT '会员权益',
  `is_upgrade` int(11) DEFAULT NULL COMMENT '是否可以自动升级到该等级（1-可以    -1-不可以）',
  `limit_value` bigint(20) DEFAULT NULL COMMENT '升级门槛',
  `limit_type` int(11) DEFAULT NULL COMMENT '升级门槛类型（1-积分    2-消费）',
  `point_rate` decimal(10,2) DEFAULT '1.00' COMMENT '消费获取积分倍数',
  `acquisition_method_type` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT '获取资格的key',
  `acquisition_method` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT '获取资格',
  `period_of_validity_type` int(11) DEFAULT NULL COMMENT '1-固定起止日期     2-领取之后时长     3-永久',
  `validity_start_time` datetime DEFAULT NULL COMMENT '有效期开始时间',
  `validity_end_time` datetime DEFAULT NULL COMMENT '有效期结束时间',
  `validity_num` int(11) DEFAULT NULL COMMENT '领取之后有效时长',
  `validity_type` int(11) DEFAULT NULL COMMENT '有效时长单位   1-天   2-月    3-年',
  `price` decimal(10,2) DEFAULT NULL COMMENT '价格---购买会员',
  `create_time` datetime DEFAULT NULL COMMENT '创建时间',
  `create_by_user_id` bigint(20) DEFAULT NULL COMMENT '创建者user_id',
  `create_by_name` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT '创建者legal_name',
  `update_time` datetime DEFAULT NULL COMMENT '更新时间',
  `update_by_name` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT '更新人legal_name',
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=8 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='会员等级';
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `sys_user_post`
--

DROP TABLE IF EXISTS `sys_user_post`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `sys_user_post` (
  `user_id` bigint(20) NOT NULL COMMENT '用户ID',
  `post_id` bigint(20) NOT NULL COMMENT '岗位ID',
  PRIMARY KEY (`user_id`,`post_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='用户与岗位关联表';
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `sys_user_role`
--

DROP TABLE IF EXISTS `sys_user_role`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `sys_user_role` (
  `user_id` bigint(20) NOT NULL COMMENT '用户ID',
  `role_id` bigint(20) NOT NULL COMMENT '角色ID',
  PRIMARY KEY (`user_id`,`role_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='用户和角色关联表';
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `user_ex_merchant`
--

DROP TABLE IF EXISTS `user_ex_merchant`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `user_ex_merchant` (
  `id` bigint(20) NOT NULL AUTO_INCREMENT,
  `user_id` bigint(20) DEFAULT NULL COMMENT 'user表的id',
  `merchant_name` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT '商户名称',
  `merchant_en_name` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT '商户英文名称',
  `logo` text COLLATE utf8mb4_unicode_ci COMMENT '商户LOGO图',
  `shop_img` text COLLATE utf8mb4_unicode_ci COMMENT '门店图',
  `merchant_desc` text COLLATE utf8mb4_unicode_ci COMMENT '商户简介',
  `merchant_address` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT '店铺地址',
  `ein` varchar(20) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT 'Employer Identification Number',
  `legal_per_card` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT '法人身份证',
  `merchant_type` int(11) DEFAULT '-1' COMMENT '对公对私（-1：对私    1：对公）',
  `account_name` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT '开户名称',
  `bank_account` varchar(30) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT 'Account number',
  `opening_bank` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT '开户行',
  `ssn` varchar(20) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT 'Social Security Number',
  `rn` varchar(18) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT 'Routing Number',
  `ac_holder_name` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT 'Account Holder Name',
  `zipcode` varchar(20) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT '邮编',
  `business_license` text COLLATE utf8mb4_unicode_ci COMMENT '营业执照图',
  `permit_license` text COLLATE utf8mb4_unicode_ci COMMENT '许可证图',
  `principal_type` int(11) DEFAULT '2' COMMENT '主体类型（1-个人   2-公司）',
  `dept_id` bigint(20) DEFAULT NULL COMMENT '学校id',
  `status` int(11) DEFAULT '1' COMMENT '状态（-1：冻结   1：待审核    2：审核拒绝     3：审核通过）',
  `longitude` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT '经度',
  `latitude` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT '纬度',
  `create_by_id` bigint(20) DEFAULT NULL COMMENT '创建人的user_id',
  `create_by_name` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT '创建人法定姓名',
  `create_time` datetime DEFAULT NULL COMMENT '创建时间',
  `update_time` datetime DEFAULT NULL COMMENT '更新时间',
  `weight_level` int(11) DEFAULT '0' COMMENT '权重排序',
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=19 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='商户';
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `user_ex_merchant_audit_log`
--

DROP TABLE IF EXISTS `user_ex_merchant_audit_log`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `user_ex_merchant_audit_log` (
  `id` bigint(20) NOT NULL AUTO_INCREMENT,
  `merchant_id` bigint(20) DEFAULT NULL,
  `operat_status` int(11) DEFAULT NULL COMMENT '操作状态码',
  `operat_name` varchar(20) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT '操作名称',
  `operate_remark` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT '备注',
  `operate_by_user_id` bigint(20) DEFAULT NULL COMMENT '操作人的userid',
  `operate_by_name` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT '操作人的legalName',
  `operate_time` datetime DEFAULT NULL COMMENT '操作时间',
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=10 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='商户审核日志';
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `user_extends_data`
--

DROP TABLE IF EXISTS `user_extends_data`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `user_extends_data` (
  `user_id` bigint(20) DEFAULT NULL COMMENT '用户user_id',
  `user_point` decimal(10,2) DEFAULT NULL COMMENT '用户积分'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='用户数据扩展表';
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `user_extends_data_log`
--

DROP TABLE IF EXISTS `user_extends_data_log`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `user_extends_data_log` (
  `user_id` bigint(20) DEFAULT NULL COMMENT '用户id',
  `ex_point` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT '变更内容',
  `ex_type` int(11) DEFAULT NULL COMMENT '1-积分',
  `ex_remark` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT '变更备注',
  `create_time` datetime DEFAULT NULL COMMENT '核销时间'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='用户数据积分等日志记录';
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `user_level_ex_equity`
--

DROP TABLE IF EXISTS `user_level_ex_equity`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `user_level_ex_equity` (
  `level_id` bigint(20) DEFAULT NULL COMMENT '会员等级对应的id',
  `equity_id` bigint(20) DEFAULT NULL COMMENT '权益id',
  `equ_name` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT '权益名称',
  `equ_tag` varchar(30) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT '权益标识',
  `equ_sort` int(11) DEFAULT NULL COMMENT '排序',
  `create_time` datetime DEFAULT NULL COMMENT '创建时间'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='会员等级关联权益';
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `volunteer_man_hour`
--

DROP TABLE IF EXISTS `volunteer_man_hour`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `volunteer_man_hour` (
  `user_id` bigint(20) NOT NULL COMMENT '用户id',
  `total_minutes` bigint(20) DEFAULT '0' COMMENT '总工时'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='志愿者总工时';
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `volunteer_record`
--

DROP TABLE IF EXISTS `volunteer_record`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `volunteer_record` (
  `id` bigint(20) NOT NULL AUTO_INCREMENT,
  `user_id` bigint(20) DEFAULT NULL,
  `start_time` datetime DEFAULT NULL,
  `end_time` datetime DEFAULT NULL,
  `type` int(11) DEFAULT '1' COMMENT '1 只签到       2 签退完成',
  `status` int(11) DEFAULT '-1' COMMENT '状态（-1：待审核     1：审核通过     2：审核拒绝）',
  `remark` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT '备注说明',
  `operate_user_id` bigint(20) DEFAULT NULL COMMENT '操作人的用户id',
  `operate_legal_name` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT '操作人法定姓名',
  `time_offset` varchar(20) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT '时区和北京时间时差',
  `create_time` datetime DEFAULT NULL COMMENT '创建时间',
  `audit_legal_name` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT '审核人法定名',
  `audit_time` datetime DEFAULT NULL COMMENT '审核时间',
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=375 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='志愿者打卡记录';
/*!40101 SET character_set_client = @saved_cs_client */;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2026-04-05  6:20:16
