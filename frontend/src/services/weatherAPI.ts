// Weather API Service using weatherapi.com
// 🔧 文档: https://www.weatherapi.com/docs/
// 免费版特性: 实时天气 + 3天预报 + UV指数 + 风力 + 湿度
import { getApiUrl } from '../utils/environment';

const WEATHER_API_KEY = process.env.EXPO_PUBLIC_WEATHER_API_KEY || 'demo';

interface WeatherData {
  location: {
    name: string;
    region: string;
    country: string;
    lat: number;
    lon: number;
    tz_id: string;
    localtime_epoch: number;
    localtime: string;
  };
  current: {
    temp_c: number;
    temp_f: number;
    is_day: number;
    condition: {
      text: string;
      icon: string;
      code: number;
    };
    wind_kph: number;
    wind_mph: number;
    wind_degree: number;
    wind_dir: string;
    pressure_mb: number;
    pressure_in: number;
    precip_mm: number;
    precip_in: number;
    humidity: number;
    cloud: number;
    feelslike_c: number;
    feelslike_f: number;
    windchill_c: number;
    windchill_f: number;
    heatindex_c: number;
    heatindex_f: number;
    dew_point_c: number;
    dew_point_f: number;
    vis_km: number;
    vis_miles: number;
    uv: number; // 🆕 UV指数 (免费版支持)
    gust_kph: number; // 🆕 阵风速度
    gust_mph: number;
  };
  forecast?: {
    forecastday: Array<{
      date: string;
      date_epoch: number;
      day: {
        maxtemp_c: number;
        maxtemp_f: number;
        mintemp_c: number;
        mintemp_f: number;
        avgtemp_c: number;
        avgtemp_f: number;
        maxwind_kph: number;
        maxwind_mph: number;
        total_precip_mm: number;
        total_precip_in: number;
        total_snow_cm: number;
        avg_vis_km: number;
        avg_vis_miles: number;
        avg_humidity: number;
        daily_will_it_rain: number;
        daily_chance_of_rain: number;
        daily_will_it_snow: number;
        daily_chance_of_snow: number;
        condition: {
          text: string;
          icon: string;
          code: number;
        };
        uv: number; // 🆕 UV指数
      };
      astro: {
        sunrise: string;
        sunset: string;
        moonrise: string;
        moonset: string;
        moon_phase: string;
        moon_illumination: string;
      };
    }>;
  };
}

class WeatherAPIService {
  private baseUrl = 'https://api.weatherapi.com/v1';

  /**
   * 获取实时天气 + 3天预报数据
   * 🆓 免费版支持: 实时天气 + 3天预报
   */
  async getWeatherByCity(
    city: string,
    lang: string = 'en',
    includeForecast: boolean = false
  ): Promise<WeatherData | null> {
    if (!city) {
      console.warn('⚠️ 城市名称不能为空');
      return null;
    }

    try {
      const cityName = city.split(',')[0].trim();
      console.log('🌤️ 获取天气:', { cityName, lang, forecast: includeForecast });

      // 🔧 查询参数说明:
      // - aqi=no: 不获取空气质量数据（节省请求）
      // - alerts=no: 不获取警告信息（节省请求）
      // - days=3: 获取3天预报（免费版最多3天）
      const endpoint = includeForecast ? 'forecast.json' : 'current.json';
      const daysParam = includeForecast ? '&days=3&alerts=no' : '';

      const url = `${this.baseUrl}/${endpoint}?key=${WEATHER_API_KEY}&q=${encodeURIComponent(
        cityName
      )}&aqi=no${daysParam}&lang=${lang}`;

      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
        },
      });

      if (!response.ok) {
        console.warn(`⚠️ 天气API请求失败: ${response.status}`);
        return null;
      }

      const data = await response.json();

      if (data.error) {
        console.warn('⚠️ 天气API错误:', data.error);
        return null;
      }

      console.log('✅ 天气数据成功:', {
        city: data.location?.name,
        temp: data.current?.temp_c,
        condition: data.current?.condition?.text,
        uv: data.current?.uv,
        humidity: data.current?.humidity,
        wind: data.current?.wind_kph,
      });

      return data as WeatherData;
    } catch (error: any) {
      console.warn('⚠️ 获取天气异常:', error.message);
      return null;
    }
  }

  /**
   * 根据坐标获取天气
   */
  async getWeatherByCoordinates(
    latitude: number,
    longitude: number,
    lang: string = 'en',
    includeForecast: boolean = false
  ): Promise<WeatherData | null> {
    if (!latitude || !longitude) {
      console.warn('⚠️ 坐标不能为空');
      return null;
    }

    try {
      console.log('🌤️ 按坐标获取天气:', { latitude, longitude, lang });

      const endpoint = includeForecast ? 'forecast.json' : 'current.json';
      const daysParam = includeForecast ? '&days=3&alerts=no' : '';

      const url = `${this.baseUrl}/${endpoint}?key=${WEATHER_API_KEY}&q=${latitude},${longitude}&aqi=no${daysParam}&lang=${lang}`;

      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
        },
      });

      if (!response.ok) {
        console.warn(`⚠️ 天气API请求失败: ${response.status}`);
        return null;
      }

      const data = await response.json();

      if (data.error) {
        console.warn('⚠️ 天气API错误:', data.error);
        return null;
      }

      return data as WeatherData;
    } catch (error: any) {
      console.warn('⚠️ 获取天气异常:', error.message);
      return null;
    }
  }

  /**
   * 格式化温度范围显示
   */
  formatTemperatureRange(weather: WeatherData | null): string {
    if (!weather) return '--°C';

    const temp = Math.round(weather.current.temp_c);
    const range = 2;
    return `${temp - range}°C ~ ${temp + range}°C`;
  }

  /**
   * 获取完整的天气描述
   */
  getWeatherDescription(weather: WeatherData | null): string {
    if (!weather) return '天气数据加载失败';
    return weather.current.condition.text;
  }

  /**
   * 获取天气图标URL
   */
  getWeatherIconUrl(weather: WeatherData | null): string {
    if (!weather?.current?.condition?.icon) return '';
    return 'https:' + weather.current.condition.icon;
  }

  /**
   * 获取UV指数等级（0-11）
   * 🆓 免费版支持
   */
  getUVLevel(weather: WeatherData | null): {
    level: number;
    text: string;
    color: string;
  } | null {
    if (!weather?.current?.uv) return null;

    const uv = weather.current.uv;
    let text = '低';
    let color = '#2ECC71'; // 绿色

    if (uv >= 3 && uv < 6) {
      text = '中等';
      color = '#FFA500'; // 橙色
    } else if (uv >= 6 && uv < 8) {
      text = '高';
      color = '#FF6B35'; // 红橙色
    } else if (uv >= 8 && uv < 11) {
      text = '很高';
      color = '#C0392B'; // 深红
    } else if (uv >= 11) {
      text = '极高';
      color = '#8B0000'; // 暗红
    }

    return { level: Math.round(uv), text, color };
  }

  /**
   * 获取湿度等级
   */
  getHumidityLevel(weather: WeatherData | null): {
    humidity: number;
    text: string;
  } | null {
    if (!weather?.current?.humidity) return null;

    const humidity = weather.current.humidity;
    let text = '干燥';
    if (humidity > 40 && humidity <= 60) text = '舒适';
    if (humidity > 60 && humidity <= 80) text = '潮湿';
    if (humidity > 80) text = '很潮湿';

    return { humidity, text };
  }

  /**
   * 获取风力等级 (Beaufort scale)
   */
  getWindLevel(weather: WeatherData | null): {
    speed: number;
    direction: string;
    beaufort: number;
    text: string;
  } | null {
    if (!weather?.current) return null;

    const speed = Math.round(weather.current.wind_kph);
    let beaufort = 0;
    let text = '无风';

    if (speed < 1) beaufort = 0;
    else if (speed < 5) { beaufort = 1; text = '微风'; }
    else if (speed < 11) { beaufort = 2; text = '软风'; }
    else if (speed < 19) { beaufort = 3; text = '微风'; }
    else if (speed < 28) { beaufort = 4; text = '和风'; }
    else if (speed < 38) { beaufort = 5; text = '劲风'; }
    else if (speed < 49) { beaufort = 6; text = '强风'; }
    else { beaufort = 7; text = '疾风'; }

    return {
      speed,
      direction: weather.current.wind_dir,
      beaufort,
      text,
    };
  }

  /**
   * 获取体感温度
   */
  getFeelsLikeTemp(weather: WeatherData | null): number | null {
    return weather?.current?.feelslike_c ? Math.round(weather.current.feelslike_c) : null;
  }

  /**
   * 获取能见度等级
   */
  getVisibility(weather: WeatherData | null): {
    distance: number;
    unit: string;
    level: string;
  } | null {
    if (!weather?.current?.vis_km) return null;

    const distance = weather.current.vis_km;
    let level = '优秀';
    if (distance < 5) level = '很差';
    else if (distance < 10) level = '差';
    else if (distance < 20) level = '中';

    return { distance: Math.round(distance), unit: 'km', level };
  }
}

export const weatherAPI = new WeatherAPIService();
