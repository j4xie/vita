// 优化的图标包 - 只包含Ionicons，移除其他2.7MB字体
import { Ionicons as OriginalIonicons } from '@expo/vector-icons';

// 重新导出Ionicons
export const Ionicons = OriginalIonicons;

// 为其他图标库创建空的占位符，防止导入错误
export const MaterialCommunityIcons = () => null;
export const FontAwesome = () => null;
export const FontAwesome5 = () => null;
export const FontAwesome6 = () => null;
export const MaterialIcons = () => null;
export const AntDesign = () => null;
export const Feather = () => null;
export const Entypo = () => null;
export const Fontisto = () => null;

// 默认导出Ionicons
export default Ionicons;