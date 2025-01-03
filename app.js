const GEOCODING_API = "https://geocoding-api.open-meteo.com/v1/search";
const WEATHER_API = "https://api.open-meteo.com/v1/forecast";

let currentForecastDays = 5;
let lastSearchValue = "";

let customWallpapers = {};

const translations = {
  tr: {
    searchPlaceholder: "Hava durumunu ara...",
    feelsLike: "Hissedilen",
    windSpeed: "Rüzgar hızı",
    loading: "Yükleniyor...",
    cityNotFound: "Şehir Bulunamadı",
    settings: "Ayarlar",
    backgrounds: "Hava Durumuna Göre Arka Planlar",
    language: "Dil Seçimi",
    clear: "Açık Hava",
    clouds: "Bulutlu",
    rain: "Yağmurlu",
    snow: "Karlı",
    mist: "Sisli",
    night: "Gece",
    forecast5: "5 Günlük",
    forecast16: "16 Günlük",
    min: "Min",
    max: "Max",
  },
  en: {
    searchPlaceholder: "Search weather...",
    feelsLike: "Feels like",
    windSpeed: "Wind speed",
    loading: "Loading...",
    cityNotFound: "City Not Found",
    settings: "Settings",
    backgrounds: "Weather Backgrounds",
    language: "Language Selection",
    clear: "Clear",
    clouds: "Cloudy",
    rain: "Rainy",
    snow: "Snowy",
    mist: "Misty",
    night: "Night",
    forecast5: "5 Days",
    forecast16: "16 Days",
    min: "Min",
    max: "Max",
  },
  de: {
    searchPlaceholder: "Wetter suchen...",
    feelsLike: "Gefühlt wie",
    windSpeed: "Windgeschwindigkeit",
    loading: "Wird geladen...",
    cityNotFound: "Stadt nicht gefunden",
    settings: "Einstellungen",
    backgrounds: "Wetter Hintergründe",
    language: "Sprachauswahl",
    clear: "Klar",
    clouds: "Bewölkt",
    rain: "Regnerisch",
    snow: "Verschneit",
    mist: "Neblig",
    night: "Nacht",
    forecast5: "5 Tage",
    forecast16: "16 Tage",
    min: "Min",
    max: "Max",
  },
};

function setQuery(event) {
  if (event.keyCode === 13) {
    const searchValue = arama.value.trim();
    if (searchValue) {
      lastSearchValue = searchValue;
      getCoordinates(searchValue);
    } else {
      const altbar = document.querySelector(".altbar");
      altbar.classList.remove("visible");
    }
  }
}

const getCoordinates = async (cityName) => {
  try {
    const response = await fetch(
      `${GEOCODING_API}?name=${cityName}&count=1&language=tr`
    );
    const data = await response.json();
    console.log("Geocoding API Yanıtı:", data);

    if (data.results && data.results.length > 0) {
      const location = data.results[0];
      goster(location);
      getForecast(location);
    } else {
      showError();
    }
  } catch (error) {
    console.error("Konum bulunamadı:", error);
    showError();
  }
};

const goster = (location) => {
  let sehir = document.querySelector(".sehir");
  sehir.innerText = `${location.name}, ${location.country}`;

  let mapIframe = document.querySelector("#map");
  mapIframe.src = `https://www.openstreetmap.org/export/embed.html?bbox=${
    location.longitude - 0.9
  },${location.latitude - 0.9},${location.longitude + 0.9},${
    location.latitude + 0.9
  }`;
};

const showError = () => {
  let sehir = document.querySelector(".sehir");
  let derece = document.querySelector(".derece");
  let minmax = document.querySelector(".minmax");
  let icon = document.querySelector(".icon");
  let wind = document.querySelector(".wind-speed");
  let hissedilen = document.querySelector(".hissedilen");

  sehir.innerText = "Şehir Bulunamadı";
  derece.innerText = "";
  minmax.innerText = "";
  wind.innerText = "";
  hissedilen.innerText = "";
  icon.src = "assets/not-found.png";
};

const getForecast = async (location) => {
  try {
    const response = await fetch(
      `${WEATHER_API}?latitude=${location.latitude}&longitude=${location.longitude}&current=temperature_2m,relative_humidity_2m,apparent_temperature,wind_speed_10m&daily=temperature_2m_max,temperature_2m_min,weather_code&timezone=auto&forecast_days=${currentForecastDays}`
    );
    const data = await response.json();
    console.log("Hava Durumu API Yanıtı:", data);

    displayWeather(data);
    displayForecast(data.daily);
  } catch (error) {
    console.error("Hava durumu verileri alınamadı:", error);
  }
};

const displayWeather = (data) => {
  const lang = localStorage.getItem("language") || "tr";
  const texts = translations[lang];

  let derece = document.querySelector(".derece");
  derece.innerText = Math.round(data.current.temperature_2m) + "°C";

  let hissedilen = document.querySelector(".hissedilen");
  hissedilen.innerText = `${texts.feelsLike}: ${Math.round(
    data.current.apparent_temperature
  )}°C`;

  let wind = document.querySelector(".wind-speed");
  wind.innerText = `${texts.windSpeed}: ${data.current.wind_speed_10m} km/s`;

  let minmax = document.querySelector(".minmax");
  minmax.innerText = `${texts.min}: ${Math.round(
    data.daily.temperature_2m_min[0]
  )}°C, ${texts.max}: ${Math.round(data.daily.temperature_2m_max[0])}°C`;

  let icon = document.querySelector(".icon");
  icon.src = getWeatherIcon(data.current.weather_code);
};

const displayForecast = (daily) => {
  const altbar = document.querySelector(".altbar");
  altbar.innerHTML = "";
  altbar.classList.add("visible");

  const today = new Date().toLocaleDateString("tr-TR");

  for (let i = 0; i < currentForecastDays; i++) {
    const date = new Date(daily.time[i]);
    const isToday = date.toLocaleDateString("tr-TR") === today;

    const dayDiv = document.createElement("div");
    dayDiv.className = isToday ? "bugun" : "havadurumu-alt";

    dayDiv.innerHTML = `
      <div class="gun ${isToday ? "day-bugun" : ""}">${getTurkishDay(
      date
    )}</div>
      <img src="${getWeatherIcon(daily.weather_code[i])}" 
           alt="weather icon" 
           class="${isToday ? "alt-icon" : "w-icon"}">
      <div class="temp">${Math.round(daily.temperature_2m_max[i])}°C</div>
    `;

    altbar.appendChild(dayDiv);
  }
};

function changeForecast(days) {
  currentForecastDays = days;

  document.querySelectorAll(".forecast-btn").forEach((btn) => {
    btn.classList.remove("active");
  });
  document
    .querySelector(`[onclick="changeForecast(${days})"]`)
    .classList.add("active");

  const searchValue = arama.value.trim();
  if (searchValue) {
    lastSearchValue = searchValue;
    getCoordinates(searchValue);
  }
}

function showForecastPopup(days) {
  const searchValue = arama.value.trim() || lastSearchValue;
  if (!searchValue) {
    alert("Lütfen bir şehir adı girin.");
    return;
  }
  showLoading();
  const popup = document.getElementById("forecast-popup");
  popup.style.display = "block";

  document.querySelectorAll(".forecast-btn").forEach((btn) => {
    btn.classList.remove("active");
  });
  document
    .querySelector(`[onclick="showForecastPopup(${days})"]`)
    .classList.add("active");

  getLongForecast(searchValue, days).finally(hideLoading);
}

function hideForecastPopup() {
  const popup = document.getElementById("forecast-popup");
  popup.style.display = "none";

  document.querySelectorAll(".forecast-btn").forEach((btn) => {
    btn.classList.remove("active");
  });
  document
    .querySelector('[onclick="changeForecast(5)"]')
    .classList.add("active");

  const searchValue = arama.value.trim();
  if (searchValue) {
    getCoordinates(searchValue);
  }
}

document.addEventListener("DOMContentLoaded", () => {
  const popup = document.getElementById("forecast-popup");
  popup.addEventListener("click", function (e) {
    if (e.target === this) {
      hideForecastPopup();
    }
  });
});

const getLongForecast = async (cityName, days) => {
  try {
    const geoResponse = await fetch(
      `${GEOCODING_API}?name=${cityName}&count=1&language=tr`
    );
    const geoData = await geoResponse.json();

    if (geoData.results && geoData.results.length > 0) {
      const location = geoData.results[0];

      const response = await fetch(
        `${WEATHER_API}?latitude=${location.latitude}&longitude=${location.longitude}&daily=temperature_2m_max,temperature_2m_min,weather_code,precipitation_probability_mean&timezone=auto&forecast_days=${days}`
      );
      const data = await response.json();

      if (data.daily) {
        displayLongForecast(data.daily, location, days);
      } else {
        console.error("Hava durumu verisi alınamadı");
      }
    }
  } catch (error) {
    console.error("Uzun dönem tahmin alınamadı:", error);
  }
};

const displayLongForecast = (daily, location, days) => {
  const lang = localStorage.getItem("language") || "tr";
  const texts = translations[lang];

  const popup = document.getElementById("forecast-popup");
  const container = popup.querySelector(".popup-forecast-container");

  container.innerHTML = `<h2 style="grid-column: 1/-1; color: white; text-align: center; margin-bottom: 20px;">
    ${location.name}, ${location.country} - ${days} ${texts.forecast16.replace(
    "16",
    ""
  )}</h2>`;

  daily.time.forEach((time, index) => {
    const date = new Date(time);
    const dayDiv = document.createElement("div");
    dayDiv.className = "popup-forecast-item";

    dayDiv.innerHTML = `
      <div style="font-weight: bold; font-size: 1.2em; margin-bottom: 10px;">
        ${getTurkishDay(date)} <br>
        ${date.toLocaleDateString(
          lang === "tr" ? "tr-TR" : lang === "de" ? "de-DE" : "en-US"
        )}
      </div>
      <img src="${getWeatherIcon(daily.weather_code[index])}" alt="hava durumu">
      <div style="margin-top: 15px;">
        <div style="color: #ff9800; font-size: 1.1em;">${
          texts.max
        }: ${Math.round(daily.temperature_2m_max[index])}°C</div>
        <div style="color: #03a9f4; font-size: 1.1em;">${
          texts.min
        }: ${Math.round(daily.temperature_2m_min[index])}°C</div>
      </div>
      <div style="margin-top: 10px; font-size: 1em; color: #ddd;">
        ${getWeatherDescription(daily.weather_code[index])}
      </div>
    `;

    container.appendChild(dayDiv);
  });

  popup.style.display = "block";
};

const getTurkishDay = (date) => {
  const lang = localStorage.getItem("language") || "tr";
  const days = {
    tr: {
      0: "Pazar",
      1: "Pazartesi",
      2: "Salı",
      3: "Çarşamba",
      4: "Perşembe",
      5: "Cuma",
      6: "Cumartesi",
    },
    en: {
      0: "Sunday",
      1: "Monday",
      2: "Tuesday",
      3: "Wednesday",
      4: "Thursday",
      5: "Friday",
      6: "Saturday",
    },
    de: {
      0: "Sonntag",
      1: "Montag",
      2: "Dienstag",
      3: "Mittwoch",
      4: "Donnerstag",
      5: "Freitag",
      6: "Samstag",
    },
  };
  return days[lang][date.getDay()];
};

const getWeatherIcon = (code) => {
  const iconMap = {
    0: "01d",
    1: "02d",
    2: "03d",
    3: "04d",
    45: "50d",
    48: "50d",
    51: "09d",
    53: "09d",
    55: "09d",
    56: "13d",
    57: "13d",
    61: "10d",
    63: "10d",
    65: "10d",
    66: "13d",
    67: "13d",
    71: "13d",
    73: "13d",
    75: "13d",
    77: "13d",
    80: "09d",
    81: "09d",
    82: "09d",
    85: "13d",
    86: "13d",
    95: "11d",
    96: "11d",
    99: "11d",
  };

  const hour = new Date().getHours();
  const isNight = hour >= 20 || hour < 6;
  const iconCode = iconMap[code] || "01d";

  return `https://openweathermap.org/img/wn/${iconCode.replace(
    "d",
    isNight ? "n" : "d"
  )}@2x.png`;
};

const arama = document.getElementById("search-locate");
arama.addEventListener("keypress", setQuery);

let clickS = new Audio();
clickS.src = "assets/clicked.mp3";

const mapElement = document.getElementById("map");
const overlayElement = document.getElementById("overlay");
const closeButton = document.getElementById("close-map");
let display = 0;

function show() {
  const mapButton = document.querySelector(".map-button");
  mapButton.classList.toggle("active");

  if (mapButton.classList.contains("active")) {
    showMap();
  } else {
    hideMap();
  }
  clickS.play();
}

function showMap() {
  mapElement.style.visibility = "visible";
  mapElement.style.opacity = "1";
  mapElement.style.transform = "translateY(0)";
  overlayElement.classList.add("visible");
  closeButton.classList.add("visible");
  display = 1;
}

function hideMap() {
  mapElement.style.visibility = "hidden";
  mapElement.style.opacity = "0";
  mapElement.style.transform = "translateY(-20px)";
  overlayElement.classList.remove("visible");
  closeButton.classList.remove("visible");
  const mapButton = document.querySelector(".map-button");
  mapButton.classList.remove("active");
  display = 0;
}

closeButton.addEventListener("click", () => {
  hideMap();
  clickS.play();
});

overlayElement.addEventListener("click", () => {
  hideMap();
  clickS.play();
});

function showLoading() {
  const loading = document.getElementById("loading");
  loading.style.display = "block";
}

function hideLoading() {
  const loading = document.getElementById("loading");
  loading.style.display = "none";
}

function toggleSettings() {
  const panel = document.querySelector(".settings-panel");
  panel.classList.toggle("active");

  const settingsButton = document.querySelector(".settings-button");
  settingsButton.style.transform = panel.classList.contains("active")
    ? "rotate(90deg)"
    : "rotate(0)";
}

document.addEventListener("DOMContentLoaded", () => {

  const savedWallpapers = localStorage.getItem("customWallpapers");
  if (savedWallpapers) {
    customWallpapers = JSON.parse(savedWallpapers);

    const lastWallpaper = localStorage.getItem("lastWallpaper");
    if (lastWallpaper) {
      const { type, url } = JSON.parse(lastWallpaper);
      document.body.style.backgroundImage = `url('${url}')`;

      document.querySelectorAll(".wallpaper-item").forEach((item) => {
        if (item.getAttribute("onclick").includes(type)) {
          item.style.border = "2px solid #fff";
        }
      });
    }
  }
});

function changeWallpaper(type, url) {

  customWallpapers[type] = url;

  localStorage.setItem("customWallpapers", JSON.stringify(customWallpapers));

  localStorage.setItem("lastWallpaper", JSON.stringify({ type, url }));

  document.body.style.backgroundImage = `url('${url}')`;

  document.querySelectorAll(".wallpaper-item").forEach((item) => {
    item.style.border = "none";
  });
  event.currentTarget.style.border = "2px solid #fff";
}

function changeBackground(weatherType) {
  const hour = new Date().getHours();
  if (hour >= 20 || hour < 6) {
    const nightUrl = customWallpapers["night"] || weatherBackgrounds.night;
    document.body.style.backgroundImage = `url('${nightUrl}')`;
    return;
  }

  const weatherMapping = {
    Clear: "clear",
    Clouds: "clouds",
    Rain: "rain",
    Drizzle: "rain",
    Thunderstorm: "thunderstorm",
    Snow: "snow",
    Mist: "mist",
    Fog: "mist",
    Haze: "mist",
  };

  const mappedType = weatherMapping[weatherType] || "clear";
  const backgroundUrl =
    customWallpapers[mappedType] || weatherBackgrounds[mappedType];
  document.body.style.backgroundImage = `url('${backgroundUrl}')`;
}

document.addEventListener("DOMContentLoaded", () => {
  const savedLanguage = localStorage.getItem("language") || "tr";
  document.getElementById("language-select").value = savedLanguage;
  changeLanguage(savedLanguage);
});

function changeLanguage(lang) {

  localStorage.setItem("language", lang);

  const texts = translations[lang];

  document.getElementById("search-locate").placeholder =
    texts.searchPlaceholder;
  document.querySelector(".settings-header h3").textContent = texts.settings;
  document.querySelector(".settings-section h4").textContent = texts.language;
  document.querySelector(".wallpaper-options h4").textContent =
    texts.backgrounds;

  document.querySelectorAll(".forecast-btn")[0].textContent = texts.forecast5;
  document.querySelectorAll(".forecast-btn")[1].textContent = texts.forecast16;

  document.querySelectorAll(".wallpaper-item span").forEach((span) => {
    const type = span.parentElement.getAttribute("onclick").match(/'(\w+)'/)[1];
    span.textContent = texts[type];
  });

  document.getElementById("loading").textContent = texts.loading;

  const searchValue = arama.value.trim();
  if (searchValue) {
    getCoordinates(searchValue);
  }
}

const getWeatherDescription = (code) => {
  const lang = localStorage.getItem("language") || "tr";

  const descriptions = {
    tr: {
      0: "Açık",
      1: "Çoğunlukla Açık",
      2: "Parçalı Bulutlu",
      3: "Bulutlu",
      45: "Sisli",
      48: "Yoğun Sisli",
      51: "Hafif Çisenti",
      53: "Çisenti",
      55: "Yoğun Çisenti",
      56: "Hafif Dondurucu Çisenti",
      57: "Yoğun Dondurucu Çisenti",
      61: "Hafif Yağmur",
      63: "Yağmur",
      65: "Şiddetli Yağmur",
      66: "Hafif Dondurucu Yağmur",
      67: "Şiddetli Dondurucu Yağmur",
      71: "Hafif Kar",
      73: "Kar",
      75: "Yoğun Kar",
      77: "Kar Taneleri",
      80: "Hafif Sağanak",
      81: "Sağanak",
      82: "Şiddetli Sağanak",
      85: "Hafif Kar Sağanağı",
      86: "Yoğun Kar Sağanağı",
      95: "Gök Gürültülü",
      96: "Dolu ile Gök Gürültülü",
      99: "Şiddetli Dolu ile Gök Gürültülü",
    },
    en: {
      0: "Clear",
      1: "Mostly Clear",
      2: "Partly Cloudy",
      3: "Cloudy",
      45: "Foggy",
      48: "Dense Fog",
      51: "Light Drizzle",
      53: "Drizzle",
      55: "Heavy Drizzle",
      56: "Light Freezing Drizzle",
      57: "Dense Freezing Drizzle",
      61: "Light Rain",
      63: "Rain",
      65: "Heavy Rain",
      66: "Light Freezing Rain",
      67: "Heavy Freezing Rain",
      71: "Light Snow",
      73: "Snow",
      75: "Heavy Snow",
      77: "Snow Grains",
      80: "Light Rain Showers",
      81: "Rain Showers",
      82: "Violent Rain Showers",
      85: "Light Snow Showers",
      86: "Heavy Snow Showers",
      95: "Thunderstorm",
      96: "Thunderstorm with Hail",
      99: "Thunderstorm with Heavy Hail",
    },
    de: {
      0: "Klar",
      1: "Meist Klar",
      2: "Teilweise Bewölkt",
      3: "Bewölkt",
      45: "Neblig",
      48: "Dichter Nebel",
      51: "Leichter Nieselregen",
      53: "Nieselregen",
      55: "Dichter Nieselregen",
      56: "Leichter Gefrierender Nieselregen",
      57: "Dichter Gefrierender Nieselregen",
      61: "Leichter Regen",
      63: "Regen",
      65: "Starker Regen",
      66: "Leichter Gefrierender Regen",
      67: "Starker Gefrierender Regen",
      71: "Leichter Schnee",
      73: "Schnee",
      75: "Starker Schnee",
      77: "Schneekörner",
      80: "Leichte Regenschauer",
      81: "Regenschauer",
      82: "Heftige Regenschauer",
      85: "Leichte Schneeschauer",
      86: "Starke Schneeschauer",
      95: "Gewitter",
      96: "Gewitter mit Hagel",
      99: "Gewitter mit Starkem Hagel",
    },
  };

  return descriptions[lang][code] || descriptions[lang][0];
};
