const cityInput = document.querySelector('.city-input');
const searchBtn = document.querySelector('.search-btn');
const notFoundSection = document.querySelector('.not-found');
const searchCitySection = document.querySelector('.search-city');
const weatherInfoSection = document.querySelector('.weather-info');
const countryTxt = document.querySelector('.country-txt');
const tempTxt = document.querySelector('.temp-txt');
const conditionTxt = document.querySelector('.condition-txt');
const humidityValueTxt = document.querySelector('.humidity-value-txt');
const windValueTxt = document.querySelector('.wind-value-txt');
const weatherSummaryImg = document.querySelector('.weather-summary-img');
const currentDateTxt = document.querySelector('.current-date-txt');
const forecastItemContainer = document.querySelector('.forecast-item-container');


searchBtn.addEventListener('click', () => {
    if (cityInput.value.trim() !== '') {
        updateWeatherInfo(cityInput.value);
        cityInput.value = '';
        cityInput.blur();
    }
});

cityInput.addEventListener('keydown', (event) => {
    if (event.key === 'Enter' && cityInput.value.trim() !== '') {
        updateWeatherInfo(cityInput.value);
        cityInput.value = '';
        cityInput.blur();
    }
});

async function getFetchData(endPoint, city) {
    try {
        const apiKey = "657bcb5883dec0205f74a3a40806b272";
        const apiUrl = `https://api.openweathermap.org/data/2.5/${endPoint}?q=${encodeURIComponent(city)}&appid=${apiKey}&units=metric`;
        const response = await fetch(apiUrl);
        
        // First check if the response is OK
        if (!response.ok) {
            // If not OK, try to get the error message from the response
            const errorData = await response.json();
            throw new Error(errorData.message || 'Failed to fetch data');
        }
        
        return await response.json();
    } catch (error) {
        console.error('Error fetching data:', error);
        return { 
            cod: error.message.includes('404') ? '404' : '500',
            message: error.message 
        };
    }
}

function getWeatherIcon(id) {
    if (id >= 200 && id <= 232) return 'thunderstorm.png';
    if (id >= 300 && id <= 321) return 'drizzle.png';
    if (id >= 500 && id <= 531) return 'rain.png';
    if (id >= 600 && id <= 622) return 'snowy.png';
    if (id >= 701 && id <= 781) return 'atmosphere.png';
    if (id === 800) return 'sunny.png';
    if (id >= 801 && id <= 804) return 'cloud.png';
    return 'default.png';
}

function getCurrentDate() {
    const currentDate = new Date();
    const options = { weekday: 'short', day: '2-digit', month: 'short' };
    return currentDate.toLocaleDateString('en-US', options);
}

async function updateWeatherInfo(city) {
    searchBtn.disabled = true;
    searchBtn.innerHTML = '<div class="loading-spinner"></div>';

    try {
        const weatherData = await getFetchData('weather', city);

        // Improved status code checking
        if (weatherData.cod !== 200) {
            const errorMessage = document.querySelector('.error-message');
            
            // More specific error messages
            if (weatherData.cod === '404') {
                errorMessage.textContent = `"${city}" not found. Check spelling or try a nearby city.`;
            } else if (weatherData.message) {
                errorMessage.textContent = weatherData.message;
            } else {
                errorMessage.textContent = `Failed to fetch weather data. Please try again later.`;
            }
            
            showDisplaySection(notFoundSection);
            return;
        }

        // Rest of your successful update code...
        const {
            name: cityName,
            sys: { country },
            main: { temp, humidity },
            weather: [{ id, main, description }],
            wind: { speed }
        } = weatherData;

        countryTxt.textContent = `${cityName}, ${country}`;
        tempTxt.textContent = `${Math.round(temp)}°C`;
        conditionTxt.textContent = description; // Using description instead of main for more detail
        humidityValueTxt.textContent = `${humidity}%`;
        windValueTxt.textContent = `${speed} m/s`; // Changed to standard m/s unit
        currentDateTxt.textContent = getCurrentDate();
        weatherSummaryImg.src = `${getWeatherIcon(id)}`;


        await updateForecastInfo(city);
        showDisplaySection(weatherInfoSection);

    } catch (error) {
        console.error('Error:', error);
        const errorMessage = document.querySelector('.error-message');
        errorMessage.textContent = `Network error. Please check your connection and try again.`;
        showDisplaySection(notFoundSection);
    } finally {
        searchBtn.disabled = false;
        searchBtn.innerHTML = '<img src="search.png" alt="search" height="25" width="25">';
    }
}


async function updateForecastInfo(city) {
    const forecastsData = await getFetchData('forecast', city);
    const timeTaken = '12:00:00';
    const todayDate = new Date().toISOString().split('T')[0];
    forecastItemContainer.innerHTML = '';

    forecastsData.list.forEach(forecastWeather => {
        if (forecastWeather.dt_txt.includes(timeTaken) && !forecastWeather.dt_txt.includes(todayDate)) {
            updateForecastItems(forecastWeather);
        }
    });
}

function updateForecastItems(weatherData) {
    const {
        dt_txt: date,
        weather: [{ id }],
        main: { temp }
    } = weatherData;

    const dateTaken = new Date(date);
    const dateOption = { day: '2-digit', month: 'short' };
    const dateResult = dateTaken.toLocaleDateString('en-US', dateOption);

    const forecastItem = `
    <div class="forecast-item">
        <h5 class="forecast-item-date regular-txt">${dateResult}</h5>
        <img src="./${getWeatherIcon(id)}" class="forecast-item-img">
        <h5 class="forecast-item-temp">${Math.round(temp)}°C</h5>
    </div>
`;

    forecastItemContainer.insertAdjacentHTML('beforeend', forecastItem);
}

function showDisplaySection(section) {
    [weatherInfoSection, searchCitySection, notFoundSection]
        .forEach(sec => sec.style.display = 'none');
    section.style.display = 'flex';
}
