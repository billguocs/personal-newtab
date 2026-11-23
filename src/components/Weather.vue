<template>
  <div ref="element" class="weather-widget" :class="{ compact: width < 180 }">
    <div v-if="loading" class="weather-loading" role="status"><div class="spinner"></div><span>更新天气中</span></div>
    <button v-else-if="weather" class="weather-content" :aria-label="shortLocationName + '，' + weatherInfo.description + '，' + weather.temperature + '摄氏度。点击设置位置'" @click="showSettings = true">
      <span class="weather-city"><svg viewBox="0 0 20 20" fill="none" aria-hidden="true"><path d="M15.5 8c0 4-5.5 8.5-5.5 8.5S4.5 12 4.5 8a5.5 5.5 0 1 1 11 0Z" stroke="currentColor" stroke-width="1.4"/><circle cx="10" cy="8" r="1.7" stroke="currentColor" stroke-width="1.4"/></svg><span :title="fullLocationName">{{ shortLocationName }}</span><span class="city-edit" aria-hidden="true">↗</span></span>
      <span class="weather-main"><WeatherGlyph :code="weather.weatherCode" class="weather-icon" /><span class="weather-info"><span class="temperature">{{ weather.temperature }}<small>°C</small></span><span class="weather-condition">{{ weatherInfo.description }}</span></span></span>
      <span class="weather-details"><span>湿度 {{ weather.humidity }}%</span><span>风速 {{ weather.windSpeed }} km/h</span></span>
      <span v-if="weather.forecast?.length" class="forecast-compact">
        <span v-for="day in weather.forecast.slice(0, 3)" :key="day.date" class="forecast-day">
          <span class="day-name">{{ formatShortDate(day.date) }}</span><WeatherGlyph :code="day.weatherCode" class="day-icon" />
          <span class="day-temp">{{ day.maxTemp }}° <span>{{ day.minTemp }}°</span></span>
        </span>
      </span>
    </button>
    <button v-else class="weather-error" @click="showSettings = true">
      <WeatherGlyph :code="2" class="empty-weather-icon" /><span class="empty-weather-title">天气，随你所在</span><span class="empty-weather-hint">选择城市，看看窗外的温度 <span aria-hidden="true">↗</span></span>
    </button>

    <!-- 设置面板 -->
    <ModalDialog v-if="showSettings" title="天气设置" @close="showSettings = false">
    <div class="weather-settings">
      <div class="settings-header">
        <h3>天气设置</h3>
        <button class="close-btn" @click="showSettings = false">✕</button>
      </div>
      
      <div class="settings-content">
        <button class="location-btn" @click="getLocationWeather" :disabled="locationLoading">
          <span v-if="locationLoading">定位中...</span>
          <span v-else>📍 自动获取当前位置</span>
        </button>
        
        <div class="divider">或</div>
        
        <div class="search-box">
          <input 
            v-model="searchQuery"
            type="text"
            placeholder="输入城市名称..."
            @keydown.enter="searchCity"
          />
          <button @click="searchCity" :disabled="searchLoading">
            {{ searchLoading ? '搜索中...' : '搜索' }}
          </button>
        </div>
        
        <div v-if="searchResults.length > 0" class="search-results">
          <div 
            v-for="city in searchResults" 
            :key="city.name + city.latitude"
            class="city-item"
            @click="selectCity(city)"
          >
            <span class="city-name">{{ city.name }}</span>
            <span class="city-region">{{ city.region }} {{ city.country }}</span>
          </div>
        </div>
        
        <div v-if="selectedLocation" class="current-location">
          <div class="location-label">当前位置：</div>
          <div class="location-value">{{ fullLocationName }}</div>
          <button class="refresh-btn" @click="refreshWeather">刷新天气</button>
        </div>
      </div>
    </div>
    </ModalDialog>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import ModalDialog from './ModalDialog.vue'
import WeatherGlyph from './WeatherGlyph.vue'
import { useElementSize } from '@/composables/useElementSize'
import { getCurrentLocation, searchLocation, getWeatherByLocation, getWeatherInfo } from '@/api/weather'
import type { LocationData, WeatherData } from '@/types'
import { storage } from '@/utils/storage'

const element = ref<HTMLElement>()
const { width } = useElementSize(element)
const weather = ref<WeatherData | null>(null)
const selectedLocation = ref<LocationData | null>(null)
const loading = ref(false)
const locationLoading = ref(false)
const searchLoading = ref(false)
const showSettings = ref(false)
const searchQuery = ref('')
const searchResults = ref<LocationData[]>([])

const weatherInfo = computed(() => getWeatherInfo(weather.value?.weatherCode ?? -1))

// 完整地区名
const fullLocationName = computed(() => {
  if (!selectedLocation.value) {
    return weather.value?.location || ''
  }
  const parts = []
  if (selectedLocation.value.name) parts.push(selectedLocation.value.name)
  if (selectedLocation.value.region) parts.push(selectedLocation.value.region)
  if (selectedLocation.value.country) parts.push(selectedLocation.value.country)
  return parts.join(' · ')
})

// 简短地区名（只显示城市）
const shortLocationName = computed(() => {
  if (selectedLocation.value?.name) {
    return selectedLocation.value.name
  }
  return weather.value?.location || ''
})

function formatShortDate(dateStr: string) {
  const date = new Date(dateStr)
  const today = new Date()
  const tomorrow = new Date(today)
  tomorrow.setDate(tomorrow.getDate() + 1)
  
  if (date.toDateString() === tomorrow.toDateString()) {
    return '明天'
  }
  
  const weekdays = ['日', '一', '二', '三', '四', '五', '六']
  return '周' + weekdays[date.getDay()]
}

async function loadSavedLocation() {
  const saved = await storage.getCachedData<{ location: LocationData; weather: WeatherData }>('weatherLocation')
  if (saved) {
    selectedLocation.value = saved.location
    weather.value = saved.weather
  }
}

async function getLocationWeather() {
  locationLoading.value = true
  try {
    const location = await getCurrentLocation()
    if (location) {
      await updateWeather(location)
    }
  } finally {
    locationLoading.value = false
  }
}

async function searchCity() {
  if (!searchQuery.value.trim()) return
  
  searchLoading.value = true
  try {
    searchResults.value = await searchLocation(searchQuery.value.trim())
  } finally {
    searchLoading.value = false
  }
}

async function selectCity(city: LocationData) {
  await updateWeather(city)
  searchResults.value = []
  searchQuery.value = ''
}

async function updateWeather(location: LocationData) {
  loading.value = true
  try {
    const weatherData = await getWeatherByLocation(location.latitude, location.longitude)
    if (weatherData) {
      weather.value = weatherData
      selectedLocation.value = location
      await storage.setCachedData('weatherLocation', { location, weather: weatherData })
      showSettings.value = false
    }
  } finally {
    loading.value = false
  }
}

async function refreshWeather() {
  if (selectedLocation.value) {
    await updateWeather(selectedLocation.value)
  }
}

onMounted(async () => {
  await loadSavedLocation()
  if (!selectedLocation.value) {
    getLocationWeather()
  }
})
</script>

<style scoped>
.weather-widget { min-width: 0; width: 100%; color: var(--clock-ink, var(--text-primary)); }
.weather-loading { display: flex; align-items: center; justify-content: center; gap: 10px; padding: 16px 0; color: var(--clock-muted, var(--text-secondary)); font-size: 11px; }
.spinner { width: 18px; height: 18px; border: 2px solid var(--clock-muted, var(--border-color)); border-top-color: transparent; border-radius: 50%; animation: spin 1s linear infinite; }
@keyframes spin { to { transform: rotate(360deg); } }
.weather-content { display: flex; flex-direction: column; gap: 7px; width: 100%; text-align: left; border-radius: 10px; background: transparent; color: inherit; }
.weather-city { display: flex; align-items: center; gap: 4px; font-size: 11px; color: var(--clock-muted, var(--text-secondary)); min-width: 0; width: 100%; }
.weather-city svg { width: 13px; height: 13px; flex-shrink: 0; }
.weather-city > span:first-of-type { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.city-edit { margin-left: auto; opacity: .5; }
.weather-content:hover .city-edit, .weather-content:focus-visible .city-edit { opacity: 1; }
.weather-main { display: flex; align-items: center; gap: 10px; }
.weather-icon { width: 58px; height: 58px; flex-shrink: 0; }
.weather-info { display: flex; flex-direction: column; gap: 3px; }
.temperature { font-size: 34px; line-height: 1; font-weight: 350; font-variant-numeric: tabular-nums; letter-spacing: -1px; }
.temperature small { font-size: 14px; font-weight: 400; letter-spacing: 0; margin-left: 2px; color: var(--clock-muted, var(--text-secondary)); }
.weather-condition { font-size: 10px; color: var(--clock-muted, var(--text-secondary)); }
.weather-details { display: flex; flex-wrap: wrap; gap: 4px 10px; font-size: 9px; color: var(--clock-muted, var(--text-secondary)); }
.forecast-compact { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 12px; border-top: 1px solid rgba(113,136,161,.15); padding-top: 8px; margin-top: 2px; }
.forecast-day { display: flex; align-items: center; flex-direction: column; gap: 2px; }
.day-name { color: var(--clock-muted, var(--text-secondary)); font-size: 9px; }
.day-icon { width: 25px; height: 25px; }
.day-temp { display: flex; align-items: center; gap: 4px; font-size: 10px; white-space: nowrap; font-variant-numeric: tabular-nums; }
.day-temp span { color: var(--clock-muted, var(--text-secondary)); }
.weather-error { width: 100%; text-align: left; display: flex; flex-direction: column; align-items: flex-start; gap: 7px; background: transparent; color: inherit; border-radius: 10px; }
.empty-weather-icon { width: 62px; height: 62px; }
.empty-weather-title { font-size: 13px; font-weight: 500; }
.empty-weather-hint { font-size: 10px; line-height: 1.7; color: var(--clock-muted, var(--text-secondary)); }
.compact .weather-icon { width: 40px; height: 40px; }
.compact .temperature { font-size: 29px; }
.compact .weather-details { display: none; }
.compact .forecast-compact { gap: 5px; }
.compact .day-temp { flex-direction: column; gap: 1px; }
.compact .empty-weather-icon { width: 44px; height: 44px; }

/* 设置面板 */
.settings-overlay {
  @apply fixed inset-0 z-40;
  background: rgba(0,0,0,0.5);
}

.weather-settings {
  @apply p-6;
  background: var(--glass-bg);
  backdrop-filter: blur(20px);
  border: 1px solid var(--glass-border);
  box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
}

.settings-header {
  @apply flex items-center justify-between mb-4;
}

.settings-header h3 {
  @apply text-lg font-semibold;
  color: var(--text-primary);
}

.close-btn {
  @apply w-8 h-8 rounded-full flex items-center justify-center transition-all duration-200;
  background: var(--bg-secondary);
  color: var(--text-secondary);
}

.close-btn:hover {
  background: var(--border-color);
  color: var(--text-primary);
}

.location-btn {
  @apply w-full py-3 px-4 rounded-xl font-medium transition-all duration-200;
  background: var(--accent-color);
  color: white;
}

.location-btn:hover:not(:disabled) {
  opacity: 0.9;
}

.location-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.divider {
  @apply my-4 text-center text-sm;
  color: var(--text-secondary);
}

.search-box {
  @apply flex gap-2;
}

.search-box input {
  @apply flex-1 px-4 py-2 rounded-xl outline-none;
  background: var(--bg-secondary);
  color: var(--text-primary);
  border: 1px solid var(--border-color);
}

.search-box input:focus {
  border-color: var(--accent-color);
}

.search-box button {
  @apply px-4 py-2 rounded-xl font-medium transition-all duration-200;
  background: var(--accent-color);
  color: white;
}

.search-box button:hover:not(:disabled) {
  opacity: 0.9;
}

.search-box button:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.search-results {
  @apply mt-3 max-h-40 overflow-y-auto;
}

.city-item {
  @apply p-3 rounded-lg cursor-pointer transition-all duration-200 mb-1;
  background: var(--bg-secondary);
}

.city-item:hover {
  background: var(--border-color);
}

.city-name {
  @apply block font-medium;
  color: var(--text-primary);
}

.city-region {
  @apply block text-xs mt-1;
  color: var(--text-secondary);
}

.current-location {
  @apply mt-4 pt-4;
  border-top: 1px solid var(--border-color);
}

.location-label {
  @apply text-sm mb-1;
  color: var(--text-secondary);
}

.location-value {
  @apply font-medium mb-2;
  color: var(--text-primary);
}

.refresh-btn {
  @apply px-3 py-1 rounded-lg text-sm transition-all duration-200;
  background: var(--bg-secondary);
  color: var(--text-primary);
}

.refresh-btn:hover {
  background: var(--border-color);
}
</style>
