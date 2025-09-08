import React from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';


export interface SchoolInfo {
  id: string;
  name: string;
  shortName: string;
}

interface CommunityDevModalProps {
  visible: boolean;
  school: SchoolInfo | null;
  onClose: () => void;
}

export const CommunityDevModal: React.FC<CommunityDevModalProps> = ({
  visible,
  school,
  onClose,
}) => {
  const { t } = useTranslation();
  
  // Simplified: Remove complex dark mode support for debugging
  const isDarkMode = false; // Force light mode temporarily
  
  console.log('🔍 [MODAL-DEBUG] CommunityDevModal渲染:', { visible, school, hasSchool: !!school });
  
  if (!school) {
    console.log('❌ [MODAL-DEBUG] 没有学校数据，不渲染Modal');
    return null;
  }

  // Simplified: Remove logo logic that might cause errors
  const logoSource = null;

  console.log('🎭 [MODAL-DEBUG] 准备渲染Modal:', { visible, schoolName: school.name });

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
    >
      <View style={{
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'center',
        alignItems: 'center',
      }}>
        <View style={{
          backgroundColor: 'white',
          width: '80%',
          maxHeight: '70%',
          borderRadius: 20,
          padding: 20,
        }}>
          {/* Simple header */}
          <View style={{
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: 20,
          }}>
            <Text style={{
              fontSize: 18,
              fontWeight: 'bold',
              color: '#333',
            }}>
              {school.name}
            </Text>
            <TouchableOpacity onPress={onClose} style={{
              padding: 8,
              borderRadius: 20,
              backgroundColor: '#f0f0f0',
            }}>
              <Text style={{ fontSize: 16, color: '#666' }}>✕</Text>
            </TouchableOpacity>
          </View>

          {/* 开发状态 */}
          <View style={{
            alignItems: 'center',
            marginBottom: 20,
          }}>
            <View style={{
              flexDirection: 'row',
              alignItems: 'center',
              backgroundColor: 'rgba(255, 107, 53, 0.1)',
              paddingHorizontal: 12,
              paddingVertical: 6,
              borderRadius: 16,
              marginBottom: 12,
            }}>
              <Text style={{ fontSize: 16, marginRight: 6 }}>🚧</Text>
              <Text style={{
                fontSize: 14,
                fontWeight: '600',
                color: '#FF6B35',
              }}>
                Coming Soon
              </Text>
            </View>
            <Text style={{
              fontSize: 16,
              color: '#333',
              textAlign: 'center',
            }}>
              Building a warm student community
            </Text>
          </View>

          {/* 功能列表 */}
          <View style={{ marginBottom: 20 }}>
            <Text style={{
              fontSize: 18,
              fontWeight: '700',
              color: '#333',
              marginBottom: 16,
              textAlign: 'center',
            }}>
              Upcoming Features
            </Text>
            
            {/* 功能项 */}
            <View style={{ gap: 12 }}>
              <View style={{
                flexDirection: 'row',
                alignItems: 'center',
                paddingVertical: 8,
              }}>
                <View style={{
                  width: 36,
                  height: 36,
                  borderRadius: 18,
                  backgroundColor: 'rgba(255, 107, 53, 0.1)',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginRight: 12,
                }}>
                  <Text style={{ fontSize: 18 }}>🏪</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={{
                    fontSize: 15,
                    fontWeight: '600',
                    color: '#333',
                    marginBottom: 2,
                  }}>
                    Merchant Offers
                  </Text>
                  <Text style={{
                    fontSize: 13,
                    color: '#666',
                    lineHeight: 18,
                  }}>
                    Exclusive discounts and coupons
                  </Text>
                </View>
              </View>

              <View style={{
                flexDirection: 'row',
                alignItems: 'center',
                paddingVertical: 8,
              }}>
                <View style={{
                  width: 36,
                  height: 36,
                  borderRadius: 18,
                  backgroundColor: 'rgba(255, 107, 53, 0.1)',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginRight: 12,
                }}>
                  <Text style={{ fontSize: 18 }}>🔄</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={{
                    fontSize: 15,
                    fontWeight: '600',
                    color: '#333',
                    marginBottom: 2,
                  }}>
                    Second-hand Market
                  </Text>
                  <Text style={{
                    fontSize: 13,
                    color: '#666',
                    lineHeight: 18,
                  }}>
                    Trade items between students
                  </Text>
                </View>
              </View>

              <View style={{
                flexDirection: 'row',
                alignItems: 'center',
                paddingVertical: 8,
              }}>
                <View style={{
                  width: 36,
                  height: 36,
                  borderRadius: 18,
                  backgroundColor: 'rgba(255, 107, 53, 0.1)',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginRight: 12,
                }}>
                  <Text style={{ fontSize: 18 }}>💼</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={{
                    fontSize: 15,
                    fontWeight: '600',
                    color: '#333',
                    marginBottom: 2,
                  }}>
                    Career Development
                  </Text>
                  <Text style={{
                    fontSize: 13,
                    color: '#666',
                    lineHeight: 18,
                  }}>
                    Job guidance and career planning
                  </Text>
                </View>
              </View>

              <View style={{
                flexDirection: 'row',
                alignItems: 'center',
                paddingVertical: 8,
              }}>
                <View style={{
                  width: 36,
                  height: 36,
                  borderRadius: 18,
                  backgroundColor: 'rgba(255, 107, 53, 0.1)',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginRight: 12,
                }}>
                  <Text style={{ fontSize: 18 }}>👥</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={{
                    fontSize: 15,
                    fontWeight: '600',
                    color: '#333',
                    marginBottom: 2,
                  }}>
                    Alumni Network
                  </Text>
                  <Text style={{
                    fontSize: 13,
                    color: '#666',
                    lineHeight: 18,
                  }}>
                    Connect with alumni and share experiences
                  </Text>
                </View>
              </View>
            </View>
          </View>

          {/* Simple close button */}
          <TouchableOpacity 
            onPress={onClose}
            style={{
              backgroundColor: '#FF6B35',
              padding: 15,
              borderRadius: 10,
              alignItems: 'center',
            }}
          >
            <Text style={{
              color: 'white',
              fontSize: 16,
              fontWeight: '600',
            }}>
              I Know
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};