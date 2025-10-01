import React, { useState, useMemo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Calendar, LocaleConfig } from 'react-native-calendars';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { theme } from '../../theme';

interface CalendarPickerProps {
  selectedDate: Date;
  onDateSelect: (date: Date) => void;
  minDate?: Date;
  maxDate?: Date;
}

export const CalendarPicker: React.FC<CalendarPickerProps> = ({
  selectedDate,
  onDateSelect,
  minDate,
  maxDate,
}) => {
  const { t, i18n } = useTranslation();
  const [currentMonth, setCurrentMonth] = useState(selectedDate.toISOString().split('T')[0]);

  // 配置中文本地化
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

  // 根据当前语言设置日历语言
  LocaleConfig.defaultLocale = i18n.language.startsWith('zh') ? 'zh' : 'en';

  // 格式化日期为 YYYY-MM-DD
  const formatDateString = (date: Date): string => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  // 计算日期范围
  const dateRange = useMemo(() => {
    const min = minDate ? formatDateString(minDate) : undefined;
    const max = maxDate ? formatDateString(maxDate) : undefined;
    return { min, max };
  }, [minDate, maxDate]);

  // 选中日期标记
  const markedDates = useMemo(() => {
    const selected = formatDateString(selectedDate);
    return {
      [selected]: {
        selected: true,
        selectedColor: theme.colors.primary,
        selectedTextColor: '#FFFFFF',
      },
    };
  }, [selectedDate]);

  // 处理日期选择
  const handleDayPress = (day: any) => {
    const date = new Date(day.dateString);
    onDateSelect(date);
  };

  // 自定义主题
  const calendarTheme = {
    backgroundColor: 'white',
    calendarBackground: 'white',
    textSectionTitleColor: theme.colors.text.secondary,
    selectedDayBackgroundColor: theme.colors.primary,
    selectedDayTextColor: '#FFFFFF',
    todayTextColor: theme.colors.primary,
    dayTextColor: theme.colors.text.primary,
    textDisabledColor: theme.colors.text.tertiary,
    dotColor: theme.colors.primary,
    selectedDotColor: '#FFFFFF',
    arrowColor: theme.colors.primary,
    monthTextColor: theme.colors.text.primary,
    indicatorColor: theme.colors.primary,
    textDayFontFamily: 'System',
    textMonthFontFamily: 'System',
    textDayHeaderFontFamily: 'System',
    textDayFontWeight: '400' as const,
    textMonthFontWeight: '600' as const,
    textDayHeaderFontWeight: '500' as const,
    textDayFontSize: 16,
    textMonthFontSize: 18,
    textDayHeaderFontSize: 13,
  };

  return (
    <View style={styles.container}>
      <Calendar
        current={currentMonth}
        minDate={dateRange.min}
        maxDate={dateRange.max}
        onDayPress={handleDayPress}
        markedDates={markedDates}
        theme={calendarTheme}
        onMonthChange={(month) => {
          setCurrentMonth(month.dateString);
        }}
        enableSwipeMonths={true}
        hideExtraDays={false}
        firstDay={1} // 周一为第一天
        renderArrow={(direction) => (
          <Ionicons
            name={direction === 'left' ? 'chevron-back' : 'chevron-forward'}
            size={24}
            color={theme.colors.primary}
          />
        )}
        style={styles.calendar}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: 'white',
    borderRadius: 12,
    overflow: 'hidden',
  },
  calendar: {
    paddingBottom: 8,
  },
});
