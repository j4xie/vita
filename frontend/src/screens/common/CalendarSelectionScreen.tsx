import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
  Platform,
  DeviceEventEmitter,
} from 'react-native';
import { Calendar, LocaleConfig } from 'react-native-calendars';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useTranslation } from 'react-i18next';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';

import { theme } from '../../theme';

type RootStackParamList = {
  CalendarSelection: {
    selectedDate: string;
    minDate: string;
    maxDate: string;
  };
};

type CalendarSelectionScreenRouteProp = RouteProp<RootStackParamList, 'CalendarSelection'>;
type CalendarSelectionScreenNavigationProp = StackNavigationProp<RootStackParamList, 'CalendarSelection'>;

export const CalendarSelectionScreen: React.FC = () => {
  const { t, i18n } = useTranslation();
  const navigation = useNavigation<CalendarSelectionScreenNavigationProp>();
  const route = useRoute<CalendarSelectionScreenRouteProp>();

  const {
    selectedDate: initialDateString,
    minDate: minDateString,
    maxDate: maxDateString,
  } = route.params;

  // 将字符串转换为Date对象
  const [selectedDate, setSelectedDate] = useState(new Date(initialDateString));

  // 配置日历本地化
  LocaleConfig.locales['zh'] = {
    monthNames: ['一月', '二月', '三月', '四月', '五月', '六月', '七月', '八月', '九月', '十月', '十一月', '十二月'],
    monthNamesShort: ['1月', '2月', '3月', '4月', '5月', '6月', '7月', '8月', '9月', '10月', '11月', '12月'],
    dayNames: ['星期日', '星期一', '星期二', '星期三', '星期四', '星期五', '星期六'],
    dayNamesShort: ['日', '一', '二', '三', '四', '五', '六'],
    today: '今天'
  };

  LocaleConfig.locales['en'] = {
    monthNames: ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'],
    monthNamesShort: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
    dayNames: ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],
    dayNamesShort: ['S', 'M', 'T', 'W', 'T', 'F', 'S'],
    today: 'Today'
  };

  LocaleConfig.defaultLocale = i18n.language.startsWith('zh') ? 'zh' : 'en';

  // 格式化日期字符串
  const formatDateString = (date: Date): string => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  // 格式化显示日期（大号）
  const formatDisplayDate = (date: Date): string => {
    return String(date.getDate());
  };

  // 格式化星期和月份
  const formatWeekdayMonth = (date: Date): string => {
    const locale = i18n.language.startsWith('zh') ? 'zh-CN' : 'en-US';
    const weekday = date.toLocaleDateString(locale, { weekday: 'short' });
    const month = date.toLocaleDateString(locale, { month: 'short' });
    return `${weekday.toUpperCase()} ${month.toUpperCase()}`;
  };

  // 处理日期选择 - 使用本地时区避免偏移
  const handleDayPress = (day: any) => {
    // 使用year/month/day构造本地日期，避免UTC时区偏移问题
    const date = new Date(day.year, day.month - 1, day.day, 0, 0, 0, 0);
    console.log('📅 [CALENDAR] 选择日期:', {
      clicked: day.dateString,
      parsed: date.toISOString(),
      local: date.toLocaleDateString(),
      year: day.year,
      month: day.month,
      day: day.day
    });
    setSelectedDate(date);
  };

  // 处理取消
  const handleCancel = () => {
    navigation.goBack();
  };

  // 处理确认
  const handleConfirm = () => {
    // 发送包含完整日期信息的数据，避免时区问题
    DeviceEventEmitter.emit('CalendarDateSelected', {
      dateString: formatDateString(selectedDate),
      year: selectedDate.getFullYear(),
      month: selectedDate.getMonth() + 1,
      day: selectedDate.getDate(),
    });

    console.log('📅 [CALENDAR] 确认选择:', {
      date: selectedDate.toLocaleDateString(),
      year: selectedDate.getFullYear(),
      month: selectedDate.getMonth() + 1,
      day: selectedDate.getDate(),
    });

    // 返回上一页
    navigation.goBack();
  };

  // 计算今天的日期字符串
  const todayString = formatDateString(new Date());
  const selectedString = formatDateString(selectedDate);

  // 选中日期和今天标记
  const markedDates = {
    // 今天的标记（如果不是选中日期）
    ...(todayString !== selectedString && {
      [todayString]: {
        marked: true,
        dotColor: theme.colors.primary,
        textColor: theme.colors.primary,
      }
    }),
    // 选中日期的标记
    [selectedString]: {
      selected: true,
      selectedColor: theme.colors.primary,
      selectedTextColor: '#FFFFFF',
      // 如果今天恰好是选中日期，也添加标记点
      ...(todayString === selectedString && { marked: true }),
    },
  };

  // 日历主题
  const calendarTheme = {
    backgroundColor: '#FFFFFF',
    calendarBackground: '#FFFFFF',
    textSectionTitleColor: '#8E8E93',
    selectedDayBackgroundColor: theme.colors.primary,
    selectedDayTextColor: '#FFFFFF',
    todayTextColor: theme.colors.primary,
    dayTextColor: '#1C1C1E',
    textDisabledColor: '#C7C7CC',
    monthTextColor: '#1C1C1E',
    textDayFontFamily: 'System',
    textMonthFontFamily: 'System',
    textDayHeaderFontFamily: 'System',
    textDayFontWeight: '600' as const,
    textMonthFontWeight: '600' as const,
    textDayHeaderFontWeight: '500' as const,
    textDayFontSize: 18,
    textMonthFontSize: 20,
    textDayHeaderFontSize: 12,
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* 顶部导航栏 */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.cancelButton}
          onPress={handleCancel}
        >
          <Text style={styles.cancelText}>{t('calendarSelection.cancel')}</Text>
        </TouchableOpacity>
        <Text style={styles.title}>{t('calendarSelection.title')}</Text>
        <View style={styles.placeholder} />
      </View>

      {/* 选中日期显示区域 */}
      <View style={styles.selectedDateContainer}>
        <Text style={styles.selectedDateLabel}>
          {t('calendarSelection.selectedDate')}
        </Text>
        <View style={styles.selectedDateDisplay}>
          <Text style={styles.selectedDateNumber}>
            {formatDisplayDate(selectedDate)}
          </Text>
          <Text style={styles.selectedDateWeekday}>
            {formatWeekdayMonth(selectedDate)}
          </Text>
        </View>
      </View>

      {/* 可滚动月历区域 */}
      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.calendarContainer}>
          <Calendar
            current={formatDateString(selectedDate)}
            minDate={minDateString}
            maxDate={maxDateString}
            onDayPress={handleDayPress}
            markedDates={markedDates}
            theme={calendarTheme}
            enableSwipeMonths={true}
            hideExtraDays={false}
            firstDay={1}
            style={styles.calendar}
          />
        </View>
      </ScrollView>

      {/* 底部确认按钮 */}
      <View style={styles.bottomButtonContainer}>
        <TouchableOpacity
          onPress={handleConfirm}
          activeOpacity={0.8}
        >
          <LinearGradient
            colors={[theme.colors.primary, theme.colors.primaryPressed]}
            style={styles.confirmButton}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            <Text style={styles.confirmButtonText}>
              {t('calendarSelection.confirm')}
            </Text>
          </LinearGradient>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F7',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#E5E5EA',
    backgroundColor: '#FFFFFF',
  },
  cancelButton: {
    paddingVertical: 4,
  },
  cancelText: {
    fontSize: 17,
    color: theme.colors.primary,
    fontWeight: '500',
  },
  title: {
    fontSize: 17,
    fontWeight: '600',
    color: '#1C1C1E',
  },
  placeholder: {
    width: 60,
  },
  selectedDateContainer: {
    paddingHorizontal: 20,
    paddingVertical: 24,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#E5E5EA',
    backgroundColor: '#FFFFFF',
  },
  selectedDateLabel: {
    fontSize: 14,
    color: '#8E8E93',
    marginBottom: 8,
  },
  selectedDateDisplay: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  selectedDateNumber: {
    fontSize: 50,
    fontWeight: '700',
    color: theme.colors.primary,
    marginRight: 12,
  },
  selectedDateWeekday: {
    fontSize: 14,
    fontWeight: '500',
    color: '#8E8E93',
  },
  scrollView: {
    flex: 1,
  },
  calendarContainer: {
    paddingHorizontal: 8,
    backgroundColor: '#FFFFFF',
  },
  calendar: {
    borderRadius: 0,
    paddingBottom: 20,
    backgroundColor: '#FFFFFF',
  },
  bottomButtonContainer: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    paddingBottom: Platform.OS === 'ios' ? 24 : 12,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: '#E5E5EA',
    backgroundColor: '#FFFFFF',
  },
  confirmButton: {
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
  },
  confirmButtonText: {
    fontSize: 17,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});
