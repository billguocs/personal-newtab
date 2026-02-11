import type { WeatherData, LocationData } from '@/types'

// 使用 Open-Meteo API (免费，无需API Key)
const GEO_API_URL = 'https://geocoding-api.open-meteo.com/v1/search'
const WEATHER_API_URL = 'https://api.open-meteo.com/v1/forecast'

export async function searchLocation(query: string): Promise<LocationData[]> {
  try {
    const response = await fetch(
      `${GEO_API_URL}?name=${encodeURIComponent(query)}&count=5&language=zh&format=json`
    )
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }
    
    const data = await response.json()
    
    if (!data.results) {
      return []
    }
    
    return data.results.map((item: any) => ({
      name: item.name,
      region: item.admin1 || '',
      country: item.country || '',
      latitude: item.latitude,
      longitude: item.longitude
    }))
  } catch (error) {
    console.error('搜索位置失败:', error)
    return []
  }
}

export async function getWeatherByLocation(lat: number, lon: number): Promise<WeatherData | null> {
  try {
    const response = await fetch(
      `${WEATHER_API_URL}?latitude=${lat}&longitude=${lon}&current=temperature_2m,relative_humidity_2m,weather_code,wind_speed_10m&timezone=auto&forecast_days=1`
    )
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }
    
    const data = await response.json()
    
    if (!data.current) {
      return null
    }
    
    return {
      temperature: Math.round(data.current.temperature_2m),
      humidity: data.current.relative_humidity_2m,
      weatherCode: data.current.weather_code,
      windSpeed: data.current.wind_speed_10m,
      location: `${lat.toFixed(2)}, ${lon.toFixed(2)}`
    }
  } catch (error) {
    console.error('获取天气失败:', error)
    return null
  }
}

export async function getCurrentLocation(): Promise<LocationData | null> {
  return new Promise((resolve) => {
    if (!navigator.geolocation) {
      console.log('浏览器不支持地理位置')
      resolve(null)
      return
    }
    
    navigator.geolocation.getCurrentPosition(
      (position) => {
        resolve({
          name: '当前位置',
          region: '',
          country: '',
          latitude: position.coords.latitude,
          longitude: position.coords.longitude
        })
      },
      (error) => {
        console.log('获取地理位置失败:', error.message)
        resolve(null)
      },
      { timeout: 10000, enableHighAccuracy: false }
    )
  })
}

// 天气代码转描述和图标
export function getWeatherInfo(code: number): { description: string; icon: string } {
  const weatherMap: Record<number, { description: string; icon: string }> = {
    0: { description: '晴朗', icon: '☀️' },
    1: { description: ' mainly clear', icon: '🌤️' },
    2: { description: '多云', icon: '⛅' },
    3: { description: '阴天', icon: '☁️' },
    45: { description: '雾', icon: '🌫️' },
    48: { description: '雾凇', icon: '🌫️' },
    51: { description: '毛毛雨', icon: '🌦️' },
    53: { description: '中雨', icon: '🌧️' },
    55: { description: '大雨', icon: '🌧️' },
    61: { description: '小雨', icon: '🌦️' },
    63: { description: '中雨', icon: '🌧️' },
    65: { description: '暴雨', icon: '⛈️' },
    71: { description: '小雪', icon: '🌨️' },
    73: { description: '中雪', icon: '❄️' },
    75: { description: '大雪', icon: '❄️' },
    95: { description: '雷雨', icon: '⛈️' },
    96: { description: '雷雨冰雹', icon: '⛈️' },
    99: { description: '强雷暴', icon: '⛈️' }
  }
  
  return weatherMap[code] || { description: '未知', icon: '❓' }
}