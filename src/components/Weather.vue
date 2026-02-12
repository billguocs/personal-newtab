<template>
  <div class="weather-widget">
    <div v-if="loading" class="weather-loading">
      <div class="spinner"></div>
    </div>
    
    <div v-else-if="weather" class="weather-content" @click="showSettings = true">
      <div class="weather-main">
        <span class="weather-icon">{{ weatherIcon }}</span>
        <div class="weather-info">
          <div class="temperature">{{ weather.temperature }}°</div>
          <div class="location">{{ shortLocationName }}</div>
        </div>
      </div>
      
      <!-- 紧凑的预报信息 -->
      <div v-if="weather.forecast && weather.forecast.length > 0" class="forecast-compact">
        <div v-for="(day, index) in weather.forecast.slice(0, 3)" :key="index" class="forecast-day">
          <span class="day-name">{{ formatShortDate(day.date) }}</span>
          <span class="day-icon">{{ getWeatherInfo(day.weatherCode).icon }}</span>
          <span class="day-temp">{{ day.maxTemp }}°</span>
        </div>
      </div>
    </div>
    
    <div v-else class="weather-error" @click="showSettings = true">
      <span class="icon">📍</span>
      <span>点击设置位置</span>
    </div>

    <!-- 设置面板 -->
    <div v-if="showSettings" class="settings-overlay" @click="showSettings = false"></div>
    <div v-if="showSettings" class="weather-settings">
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
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { getCurrentLocation, searchLocation, getWeatherByLocation, getWeatherInfo } from '@/api/weather'
import type { LocationData, WeatherData } from '@/types'
import { storage } from '@/utils/storage'

const weather = ref<WeatherData | null>(null)
const selectedLocation = ref<LocationData | null>(null)
const loading = ref(false)
const locationLoading = ref(false)
const searchLoading = ref(false)
const showSettings = ref(false)
const searchQuery = ref('')
const searchResults = ref<LocationData[]>([])

const weatherIcon = computed(() => {
  if (!weather.value) return ''
  return getWeatherInfo(weather.value.weatherCode).icon
})

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

onMounted(() => {
  loadSavedLocation()
  if (!selectedLocation.value) {
    getLocationWeather()
  }
})
</script>

<style scoped>
.weather-widget {
  @apply cursor-pointer;
}

.weather-loading {
  @apply flex items-center justify-center p-4;
}

.spinner {
  @apply w-6 h-6 border-2 border-t-transparent rounded-full animate-spin;
  border-color: var(--accent-color);
  border-top-color: transparent;
}

.weather-content {
  @apply flex items-center gap-4 p-3 rounded-xl transition-all duration-200;
  background: transparent;
  border: 1px solid rgba(255, 255, 255, 0.2);
}

.weather-content:hover {
  background: rgba(255, 255, 255, 0.5);
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.5);
}

.weather-main {
  @apply flex items-center gap-2;
}

.weather-icon {
  @apply text-3xl;
}

.weather-info {
  @apply flex flex-col;
}

.temperature {
  @apply text-2xl font-bold leading-none;
  color: var(--text-primary);
}

.location {
  @apply text-xs;
  color: var(--text-secondary);
}

/* 紧凑预报 */
.forecast-compact {
  @apply flex items-center gap-3 pl-3;
  border-left: 1px solid rgba(255, 255, 255, 0.3);
}

.forecast-day {
  @apply flex flex-col items-center gap-0.5;
  min-width: 36px;
}

.day-name {
  @apply text-xs;
  color: var(--text-secondary);
}

.day-icon {
  @apply text-lg leading-none;
}

.day-temp {
  @apply text-xs font-medium;
  color: var(--text-primary);
}

.weather-error {
  @apply flex items-center gap-2 p-3 rounded-xl cursor-pointer transition-all duration-200;
  background: transparent;
  border: 1px solid rgba(255, 255, 255, 0.2);
  color: var(--text-secondary);
}

.weather-error:hover {
  background: rgba(255, 255, 255, 0.5);
}

.icon {
  @apply text-xl;
}

/* 设置面板 */
.settings-overlay {
  @apply fixed inset-0 z-40;
  background: rgba(0,0,0,0.5);
}

.weather-settings {
  @apply fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 p-6 rounded-2xl w-80 z-50;
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
