import React from 'react';
import { Platform, FlatList, ScrollView, View } from 'react-native';
import { WebScrollContainer } from './WebScrollContainer';

interface WebFlatListProps {
  data: any[];
  renderItem: ({ item, index }: { item: any; index: number }) => React.ReactElement;
  keyExtractor?: (item: any, index: number) => string;
  refreshControl?: React.ReactElement;
  contentContainerStyle?: any;
  style?: any;
  showsVerticalScrollIndicator?: boolean;
  ListEmptyComponent?: React.ComponentType<any> | React.ReactElement | (() => React.ReactElement);
  [key: string]: any;
}

export const WebFlatList: React.FC<WebFlatListProps> = ({
  data,
  renderItem,
  keyExtractor,
  refreshControl,
  contentContainerStyle,
  style,
  showsVerticalScrollIndicator,
  ListEmptyComponent,
  ...otherProps
}) => {
  if (Platform.OS === 'web') {
    // Web平台：使用原生滚动容器完全绕过React Native限制
    return (
      <WebScrollContainer
        style={{
          padding: 0,
          ...(typeof style === 'object' ? style : {}),
        }}
      >
        <div style={{ 
          ...(typeof contentContainerStyle === 'object' ? contentContainerStyle : {}),
          minHeight: '100vh',
          paddingBottom: '120px', // 底部安全区域
        }}>
          {data.length > 0 ? (
            data.map((item, index) => {
              const key = keyExtractor ? keyExtractor(item, index) : item.id || index.toString();
              return (
                <div key={key}>
                  {renderItem({ item, index })}
                </div>
              );
            })
          ) : (
            ListEmptyComponent && (
              <div>
                {React.isValidElement(ListEmptyComponent) ? 
                  ListEmptyComponent : 
                  React.createElement(ListEmptyComponent as React.ComponentType)
                }
              </div>
            )
          )}
        </div>
        
        {/* 下拉刷新功能 - 简化版本 */}
        {refreshControl && (
          <div style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            height: '60px',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            zIndex: 1000,
          }}>
            {refreshControl}
          </div>
        )}
      </WebScrollContainer>
    );
  }

  // 移动端：使用原生FlatList
  return (
    <FlatList
      data={data}
      renderItem={renderItem}
      keyExtractor={keyExtractor}
      refreshControl={refreshControl}
      contentContainerStyle={contentContainerStyle}
      style={style}
      showsVerticalScrollIndicator={showsVerticalScrollIndicator}
      ListEmptyComponent={ListEmptyComponent}
      {...otherProps}
    />
  );
};

export default WebFlatList;