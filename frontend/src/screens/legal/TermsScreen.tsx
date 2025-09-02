import React from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { LinearGradient } from 'expo-linear-gradient';
import { theme } from '../../theme';
import { DAWN_GRADIENTS } from '../../theme/core';

interface TermsScreenProps {
  route: {
    params: {
      type: 'terms' | 'privacy';
    };
  };
}

export const TermsScreen: React.FC = () => {
  const navigation = useNavigation();
  const route = useRoute<any>();
  const { t } = useTranslation();
  const { type = 'terms' } = route.params || {};

  const isTerms = type === 'terms';
  const title = isTerms ? t('legal.terms.title') : t('legal.privacy.title');
  const content = isTerms ? t('legal.terms.full_content') : t('legal.privacy.full_content');

  // 硬编码内容作为备用（测试用）
  const fallbackContent = isTerms ? `西柚-PomeloX 服务条款

生效日期：2025年8月15日
版本：v1.0

1. 服务概述

欢迎使用西柚-PomeloX！我们是专为赴美留学生和家长打造的一站式服务与安全平台。从行前准备到在地生活，从活动报名到紧急协同，我们致力于为留学全周期提供专业服务。

2. 服务范围

核心功能：
• AI智能问答：留学攻略、签证选课租房指南
• 安心计划：失联应急响应、志愿者协查
• 接机新生服务：免费大巴预约、付费接送机
• 本地生活折扣：商家优惠券、积分体系
• 二手求职平台：信息流发布、聊天撮合
• 校友圈：邮箱验证、高信用内推
• 活动管理：活动发布、报名管理、二维码核销
• 志愿者管理：签到签出、工时统计

3. 用户注册与责任

注册要求：
• 年满14周岁（14周岁以下需监护人同意）
• 提供真实、准确、完整的注册信息
• 拥有有效的学校邮箱或推荐码
• 接受本服务条款和隐私政策

用户责任：
• 保护账户密码安全，不得向他人透露
• 对账户下的所有活动承担责任
• 及时更新账户信息，确保信息准确性

4. 行为规范

您承诺：
• 遵守中华人民共和国法律法规
• 尊重他人的合法权益和隐私
• 提供真实、准确的个人信息
• 不进行任何可能损害平台或其他用户的行为

禁止行为：
• 发布违法、有害、威胁或不当的内容
• 传播虚假信息、谣言或误导性内容
• 侵犯他人知识产权、隐私权
• 尝试破解、攻击或干扰系统
• 未经授权进行商业宣传

5. 知识产权

西柚-PomeloX 平台的所有内容，包括软件代码、界面设计、商标标识等，均受知识产权法保护，归西柚-PomeloX所有。

6. 免责声明

服务现状：
• 服务按现状提供，不保证完全无中断、无错误
• 不保证第三方活动的质量或安全性
• 不承担用户因使用服务造成的间接损失

责任限制：
在法律允许的最大范围内，我们的赔偿责任不超过您直接遭受的实际损失，且总额不超过100美元。

7. 争议解决

如有争议，建议通过以下方式解决：
• 发送邮件至：info@americanpromotioncompany.com
• 通过应用内客服系统联系
• 协商不成的，可向有管辖权的人民法院提起诉讼

8. 条款变更

我们可能根据业务发展修改本条款，重要变更将提前30天通知您。继续使用服务即视为接受新条款。

9. 联系方式

技术支持：info@americanpromotioncompany.com
法律事务：dev@americanpromotioncompany.com
客服时间：周一至周五 9:00-18:00 (北京时间)

---

感谢您选择 西柚-PomeloX

本服务条款受中华人民共和国法律管辖。我们致力于为海外中国学生提供优质的服务体验。` : `西柚-PomeloX 隐私政策

生效日期：2025年8月15日
版本：v1.0

1. 政策概述

欢迎使用西柚-PomeloX！我们深知个人信息保护的重要性，承诺严格遵守《中华人民共和国个人信息保护法》等相关法律法规。

2. 信息收集

您主动提供的信息：
• 注册信息：法定姓名、英文昵称、所属学校、学校邮箱
• 联系信息：中国或美国电话号码
• 身份验证：推荐码信息、短信验证码
• 活动相关：活动报名信息、个人偏好设置
• 志愿服务：志愿活动参与记录、签到时间

自动收集的信息：
• 设备信息：设备型号、操作系统版本、应用版本
• 使用数据：应用使用统计、功能点击记录
• 网络信息：IP地址（仅用于技术支持和安全防护）
• 推送信息：设备推送token（用于发送通知）

3. 信息使用目的

我们收集您的个人信息仅用于：
• 创建和管理您的用户账户
• 处理活动报名和志愿者管理
• 提供AI智能问答和留学攻略服务
• 发送重要的服务通知和安全提醒
• 分析用户行为，改进产品功能
• 防范欺诈和滥用行为，保护用户安全

4. 第三方服务集成

为提供完整服务，我们集成以下第三方服务：
• Gmail SMTP：用于发送验证邮件和通知
• Cloudflare R2：安全存储活动图片和用户头像
• Firebase FCM：发送重要通知和活动提醒
• Google OAuth：可选的第三方登录方式

5. 用户权利

根据法律法规，您享有以下权利：
• 知情权：了解我们收集的个人信息类型和使用目的
• 访问权：查看我们收集的关于您的个人信息
• 更正权：更正不准确的个人信息
• 删除权：请求删除您的个人信息和账户
• 限制处理权：限制某些个人信息的处理
• 数据携带权：以结构化格式获取个人数据

6. 未成年人保护

• 14岁以下：必须获得监护人同意
• 14-18岁：建议在监护人指导下使用
• 18岁以上：可独立使用所有功能

我们对未成年人信息采用更严格的安全措施。

7. 数据安全措施

技术安全：
• 采用AES-256加密算法保护敏感数据
• 全站HTTPS加密传输
• 严格的权限管理和身份验证
• 24/7安全监控和异常检测

管理安全：
• 员工仅能访问工作必需的数据
• 记录所有数据访问和操作
• 定期进行安全风险评估

8. 数据存储

• 存储位置：主要存储在中国境内服务器
• 存储期限：仅在必要期间内保存
• 删除机制：超出期限后自动删除或匿名化

9. 联系我们

如有隐私相关问题，请联系：
• 邮箱：info@americanpromotioncompany.com
• 数据保护负责人：dev@americanpromotioncompany.com
• 客服时间：周一至周五 9:00-18:00 (北京时间)

10. 政策更新

我们可能根据法律变化或业务发展修改本政策，重要更新将通过应用内通知、邮件等方式通知您。

---

感谢您的信任

保护您的隐私是我们的责任，也是我们与您建立信任关系的基础。如有任何建议或意见，欢迎反馈。`;

  const displayContent = content || fallbackContent;

  return (
    <SafeAreaView style={styles.container}>
      <LinearGradient colors={DAWN_GRADIENTS.skyCool} style={StyleSheet.absoluteFill} />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={theme.colors.text.primary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{title}</Text>
        <View style={styles.placeholder} />
      </View>

      {/* Content */}
      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={true}
      >
        <View style={styles.contentCard}>
          <Text style={styles.contentText}>
            {displayContent}
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: theme.spacing[4],
    paddingVertical: theme.spacing[3],
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border.primary,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: theme.typography.fontSize.xl,
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.text.primary,
    textAlign: 'center',
  },
  placeholder: {
    width: 40,
  },
  scrollView: {
    flex: 1,
  },
  contentContainer: {
    padding: theme.spacing[4],
  },
  contentCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing[6],
    ...theme.shadows.md,
  },
  contentText: {
    fontSize: theme.typography.fontSize.base,
    color: theme.colors.text.primary,
    lineHeight: theme.typography.fontSize.base * 1.6,
  },
});