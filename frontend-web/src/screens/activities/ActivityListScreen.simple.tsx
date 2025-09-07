import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from '../../components/web/WebLinearGradient';
import { useTranslation } from 'react-i18next';
import { pomeloXAPI } from '../../services/PomeloXAPI';
import { adaptActivityList, FrontendActivity } from '../../utils/activityAdapter';
import { useUser } from '../../context/UserContext';

// 完全复制CommunityScreen的结构，但显示活动列表
export const SimpleActivityListScreen: React.FC = () => {
  const { t } = useTranslation();
  const navigation = useNavigation<any>();
  const insets = useSafeAreaInsets();
  const { user } = useUser();
  
  const [activities, setActivities] = useState<FrontendActivity[]>([]);
  const [loading, setLoading] = useState(false);

  // 简单的活动获取
  useEffect(() => {
    const fetchActivities = async () => {
      if (!user?.id) return;
      
      try {
        setLoading(true);
        const response = await pomeloXAPI.getActivityList(1, 10, parseInt(user.id));
        if (response.code === 200) {
          const adaptedData = adaptActivityList(response, parseInt(user.id));
          setActivities(adaptedData.activities);
        }
      } catch (error) {
        console.error('获取活动失败:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchActivities();
  }, [user?.id]);

  const handleActivityPress = (activity: FrontendActivity) => {
    navigation.navigate('ActivityDetail', { activity });
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* 完全复制CommunityScreen的背景 */}
      <LinearGradient
        colors={[
          '#F8F9FA',
          '#F5F6F7', 
          '#FFFEF7',
          '#F8F9FA'
        ]}
        start={{ x: 0, y: 0 }} 
        end={{ x: 0, y: 1 }}
        style={{ position: 'absolute', left: 0, right: 0, top: 0, bottom: 0 }}
        locations={[0, 0.3, 0.7, 1]}
      />

      <ScrollView 
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        contentInsetAdjustmentBehavior="automatic"
        contentContainerStyle={[
          styles.scrollContent, 
          { 
            paddingBottom: insets.bottom + 80 
          }
        ]}
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>简化活动列表</Text>
          <Text style={styles.headerSubtitle}>
            {loading ? '加载中...' : `${activities.length} 个活动`}
          </Text>
        </View>

        {/* 活动列表 - 简单渲染 */}
        <View style={{ padding: 16 }}>
          {activities.map((activity, index) => (
            <TouchableOpacity
              key={activity.id}
              onPress={() => handleActivityPress(activity)}
              style={{
                backgroundColor: '#FFFFFF',
                padding: 16,
                marginBottom: 12,
                borderRadius: 12,
                borderWidth: 1,
                borderColor: '#E0E0E0',
              }}
            >
              <Text style={{ fontSize: 16, fontWeight: 'bold', color: '#333' }}>
                {activity.title}
              </Text>
              <Text style={{ fontSize: 14, color: '#666', marginTop: 4 }}>
                📍 {activity.location}
              </Text>
              <Text style={{ fontSize: 12, color: '#999', marginTop: 4 }}>
                📅 {activity.date} | ⏰ {activity.time}
              </Text>
            </TouchableOpacity>
          ))}
          
          {/* 添加更多内容以测试滚动 */}
          {[...Array(20)].map((_, index) => (
            <View key={`test-${index}`} style={{
              backgroundColor: '#F0F0F0',
              padding: 16,
              marginBottom: 8,
              borderRadius: 8,
            }}>
              <Text>测试滚动项目 #{index + 1}</Text>
              <Text>这是用来测试页面滚动的内容</Text>
            </View>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.02)',
  },
  
  scrollView: {
    flex: 1,
  },
  
  scrollContent: {
    paddingHorizontal: 0,
  },
  
  header: {
    paddingTop: 20,
    paddingHorizontal: 20,
    paddingBottom: 16,
  },
  
  headerTitle: {
    fontSize: 34,
    fontWeight: 'bold',
    color: '#1C1C1E',
    marginBottom: 4,
  },
  
  headerSubtitle: {
    fontSize: 16,
    color: '#6B7280',
  },
});