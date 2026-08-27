const elements = {
    cityInput: document.getElementById('city-input'),
    searchBtn: document.getElementById('search-btn'),
    themeToggle: document.getElementById('theme-toggle'),
    unitToggle: document.getElementById('unit-toggle'),
    loading: document.getElementById('loading'),
    errorMessage: document.getElementById('error-message'),
    errorText: document.getElementById('error-text'),
    weatherContent: document.getElementById('weather-content'),
    cityName: document.getElementById('city-name'),
    currentIcon: document.getElementById('current-icon'),
    currentTemp: document.getElementById('current-temp'),
    currentCondition: document.getElementById('current-condition'),
    feelsLike: document.getElementById('feels-like'),
    humidity: document.getElementById('humidity'),
    windSpeed: document.getElementById('wind-speed'),
    highLow: document.getElementById('high-low'),
    forecastContainer: document.getElementById('forecast-container')
};

let currentWeatherData = null;
let isFahrenheit = false;

// Theme Initialization
const initTheme = () => {
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme === 'dark' || (!savedTheme && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
        document.documentElement.setAttribute('data-theme', 'dark');
        elements.themeToggle.innerHTML = '<i class="fa-solid fa-sun"></i>';
    }
};

elements.themeToggle.addEventListener('click', () => {
    const currentTheme = document.documentElement.getAttribute('data-theme');
    const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', newTheme);
    localStorage.setItem('theme', newTheme);
    elements.themeToggle.innerHTML = newTheme === 'dark' ? '<i class="fa-solid fa-sun"></i>' : '<i class="fa-solid fa-moon"></i>';
});

// Unit Toggle
elements.unitToggle.addEventListener('change', (e) => {
    isFahrenheit = e.target.checked;
    if (currentWeatherData) {
        updateUI();
    }
});

// Utility Functions
const celsiusToFahrenheit = (celsius) => Math.round((celsius * 9) / 5 + 32);
const formatTemp = (tempC) => {
    if (isFahrenheit) {
        return `${celsiusToFahrenheit(tempC)}&deg;`;
    }
    return `${Math.round(tempC)}&deg;`;
};

// Weather Code Mapping (WMO Code)
const getWeatherInfo = (code, isDay = 1) => {
    const weatherMap = {
        0: { desc: 'Clear sky', icon: isDay ? 'fa-sun' : 'fa-moon' },
        1: { desc: 'Mainly clear', icon: isDay ? 'fa-cloud-sun' : 'fa-cloud-moon' },
        2: { desc: 'Partly cloudy', icon: isDay ? 'fa-cloud-sun' : 'fa-cloud-moon' },
        3: { desc: 'Overcast', icon: 'fa-cloud' },
        45: { desc: 'Fog', icon: 'fa-smog' },
        48: { desc: 'Depositing rime fog', icon: 'fa-smog' },
        51: { desc: 'Light drizzle', icon: 'fa-cloud-rain' },
        53: { desc: 'Moderate drizzle', icon: 'fa-cloud-rain' },
        55: { desc: 'Dense drizzle', icon: 'fa-cloud-showers-heavy' },
        56: { desc: 'Light freezing drizzle', icon: 'fa-cloud-rain' },
        57: { desc: 'Dense freezing drizzle', icon: 'fa-cloud-showers-heavy' },
        61: { desc: 'Slight rain', icon: 'fa-cloud-rain' },
        63: { desc: 'Moderate rain', icon: 'fa-cloud-rain' },
        65: { desc: 'Heavy rain', icon: 'fa-cloud-showers-heavy' },
        66: { desc: 'Light freezing rain', icon: 'fa-cloud-rain' },
        67: { desc: 'Heavy freezing rain', icon: 'fa-cloud-showers-heavy' },
        71: { desc: 'Slight snow fall', icon: 'fa-snowflake' },
        73: { desc: 'Moderate snow fall', icon: 'fa-snowflake' },
        75: { desc: 'Heavy snow fall', icon: 'fa-snowflake' },
        77: { desc: 'Snow grains', icon: 'fa-snowflake' },
        80: { desc: 'Slight rain showers', icon: 'fa-cloud-showers-water' },
        81: { desc: 'Moderate rain showers', icon: 'fa-cloud-showers-water' },
        82: { desc: 'Violent rain showers', icon: 'fa-cloud-showers-heavy' },
        85: { desc: 'Slight snow showers', icon: 'fa-snowflake' },
        86: { desc: 'Heavy snow showers', icon: 'fa-snowflake' },
        95: { desc: 'Thunderstorm', icon: 'fa-cloud-bolt' },
        96: { desc: 'Thunderstorm with slight hail', icon: 'fa-cloud-bolt' },
        99: { desc: 'Thunderstorm with heavy hail', icon: 'fa-cloud-bolt' }
    };

    return weatherMap[code] || { desc: 'Unknown', icon: 'fa-cloud' };
};

const getDayName = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { weekday: 'short' });
};

// API Calls
const searchCity = async () => {
    const query = elements.cityInput.value.trim();
    if (!query) return;

    elements.weatherContent.classList.add('hidden');
    elements.errorMessage.classList.add('hidden');
    elements.loading.classList.remove('hidden');

    try {
        // Geocoding API
        const geoRes = await fetch(`https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(query)}&count=1&language=en&format=json`);
        const geoData = await geoRes.json();

        if (!geoData.results || geoData.results.length === 0) {
            throw new Error('City not found. Please check the spelling.');
        }

        const location = geoData.results[0];
        
        // Weather API
        const weatherRes = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${location.latitude}&longitude=${location.longitude}&current=temperature_2m,relative_humidity_2m,apparent_temperature,is_day,weather_code,wind_speed_10m&daily=weather_code,temperature_2m_max,temperature_2m_min&timezone=auto`);
        const weatherData = await weatherRes.json();

        currentWeatherData = {
            location: `${location.name}${location.country ? `, ${location.country}` : ''}`,
            current: weatherData.current,
            daily: weatherData.daily
        };

        updateUI();
        elements.loading.classList.add('hidden');
        elements.weatherContent.classList.remove('hidden');

    } catch (err) {
        elements.loading.classList.add('hidden');
        elements.errorText.textContent = err.message || 'An error occurred while fetching data.';
        elements.errorMessage.classList.remove('hidden');
    }
};

const updateUI = () => {
    if (!currentWeatherData) return;

    const { location, current, daily } = currentWeatherData;
    const weatherInfo = getWeatherInfo(current.weather_code, current.is_day);

    // Current Weather
    elements.cityName.textContent = location;
    elements.currentTemp.innerHTML = formatTemp(current.temperature_2m);
    elements.currentIcon.className = `fa-solid ${weatherInfo.icon}`;
    elements.currentCondition.textContent = weatherInfo.desc;
    
    elements.feelsLike.innerHTML = formatTemp(current.apparent_temperature);
    elements.humidity.textContent = `${Math.round(current.relative_humidity_2m)}%`;
    elements.windSpeed.textContent = `${Math.round(current.wind_speed_10m)} km/h`;
    
    elements.highLow.innerHTML = `${formatTemp(daily.temperature_2m_max[0])} / ${formatTemp(daily.temperature_2m_min[0])}`;

    // Forecast
    elements.forecastContainer.innerHTML = '';
    
    // Skip today (index 0), show next 6 days (index 1 to 6)
    for (let i = 1; i <= 6; i++) {
        const info = getWeatherInfo(daily.weather_code[i]);
        const card = document.createElement('div');
        card.className = 'forecast-card';
        card.innerHTML = `
            <span class="forecast-day">${getDayName(daily.time[i])}</span>
            <i class="fa-solid ${info.icon}"></i>
            <span class="forecast-temp">${formatTemp(daily.temperature_2m_max[i])}</span>
            <span class="forecast-desc">${info.desc}</span>
        `;
        elements.forecastContainer.appendChild(card);
    }
};

// Event Listeners
elements.searchBtn.addEventListener('click', searchCity);
elements.cityInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        searchCity();
    }
});

// Initialize
initTheme();
elements.cityInput.value = 'London'; // Default city
searchCity();
