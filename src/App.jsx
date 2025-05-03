import { useState, useEffect } from "react";
import './index.css'

const API_KEY = "b1b15e88fa797225412429c1c50c122a1"; // Your OpenWeatherMap API key

export default function App() {
  const [city, setCity] = useState("");
  const [weather, setWeather] = useState(null);
  const [forecast, setForecast] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [theme, setTheme] = useState("system"); // Default to system theme
  const [background, setBackground] = useState(""); // Background based on weather

  // Get system dark/light mode preference
  const getSystemTheme = () => {
    if (window.matchMedia) {
      return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
    }
    return "light"; // Default to light if system preference is unknown
  };

  // Handle theme toggle (light, system)
  useEffect(() => {
    const applyTheme = (theme) => {
      if (theme === "dark") {
        document.documentElement.classList.add("dark");
      } else {
        document.documentElement.classList.remove("dark");
      }
    };

    // Update theme based on user choice or system preference
    if (theme === "system") {
      const systemTheme = getSystemTheme();
      setTheme(systemTheme); // Set the system theme
      applyTheme(systemTheme);
    } else {
      applyTheme(theme);
    }

    // Listen for changes in system theme preference
    const mediaQueryListener = (e) => {
      if (theme === "system") {
        const systemTheme = e.matches ? "dark" : "light";
        setTheme(systemTheme);
        applyTheme(systemTheme);
      }
    };
    
    window.matchMedia("(prefers-color-scheme: dark)").addEventListener("change", mediaQueryListener);

    return () => {
      window.matchMedia("(prefers-color-scheme: dark)").removeEventListener("change", mediaQueryListener);
    };
  }, [theme]);

  // Geolocation API to get the user's location
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition((position) => {
        const lat = position.coords.latitude;
        const lon = position.coords.longitude;
        fetchWeatherByCoords(lat, lon);
      });
    }
  }, []);

  // Fetch weather based on city
  const fetchWeather = async () => {
    if (!city) return;

    setLoading(true);
    setError(null);

    try {
      const res = await fetch(
        `https://api.openweathermap.org/data/2.5/weather?q=${city}&appid=${API_KEY}&units=metric`
      );

      if (!res.ok) throw new Error("City not found");

      const data = await res.json();
      setWeather(data);
      setBackground(getWeatherBackground(data.weather[0].main)); // Dynamic background based on weather
      fetchForecast(data.coord.lat, data.coord.lon); // Fetch 5-day forecast
    } catch (err) {
      setError(err.message);
      setWeather(null);
    } finally {
      setLoading(false);
    }
  };

  // Fetch weather by coordinates (used in geolocation)
  const fetchWeatherByCoords = async (lat, lon) => {
    setLoading(true);
    setError(null);

    try {
      const res = await fetch(
        `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${API_KEY}&units=metric`
      );

      if (!res.ok) throw new Error("Location not found");

      const data = await res.json();
      setWeather(data);
      setBackground(getWeatherBackground(data.weather[0].main)); // Dynamic background based on weather
      fetchForecast(lat, lon); // Fetch 5-day forecast
    } catch (err) {
      setError(err.message);
      setWeather(null);
    } finally {
      setLoading(false);
    }
  };

  // Fetch 5-day forecast
  const fetchForecast = async (lat, lon) => {
    try {
      const res = await fetch(
        `https://api.openweathermap.org/data/2.5/forecast?lat=${lat}&lon=${lon}&appid=${API_KEY}&units=metric`
      );
      const data = await res.json();
      // Extract the forecast for the next 5 days (one entry per day)
      const dailyForecast = data.list.filter((entry, index) => index % 8 === 0); // Get one forecast every 8 hours
      setForecast(dailyForecast);
    } catch (err) {
      setError("Forecast data not found");
    }
  };

  // Determine background based on weather condition
  const getWeatherBackground = (condition) => {
    switch (condition) {
      case "Clear":
        return "bg-sky-400"; // Sunny
      case "Clouds":
        return "bg-gray-500"; // Cloudy
      case "Rain":
        return "bg-blue-600"; // Rainy
      case "Snow":
        return "bg-white"; // Snowy
      default:
        return "bg-gradient-to-br from-sky-300 to-blue-500"; // Default
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter") {
      fetchWeather();
    }
  };

  // Function to format the date
  const formatDate = (timestamp) => {
    const date = new Date(timestamp * 1000);
    return date.toLocaleDateString(); // Return the date in a readable format
  };

  return (
    <div className={`min-h-screen flex items-center justify-center px-4 py-8 ${background}`}>
      <div className="bg-white/80 backdrop-blur-lg p-8 rounded-2xl shadow-2xl w-full max-w-md space-y-6 transition-all dark:bg-gray-800 dark:text-white">
        <h1 className="text-4xl font-extrabold text-center text-blue-700 tracking-wide dark:text-blue-300">
          🌤️ Weather App
        </h1>

        {/* Removed dark mode button */}
        {/* Theme is based on system's preference */}

        <div className="flex items-center gap-2">
          <input
            type="text"
            placeholder="Search city..."
            value={city}
            onChange={(e) => setCity(e.target.value)}
            onKeyDown={handleKeyDown}
            className="flex-1 px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-400 focus:outline-none text-gray-700 placeholder:text-gray-400 dark:bg-gray-700 dark:text-white dark:border-gray-600"
          />
          <button
            onClick={fetchWeather}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-semibold transition-all duration-300 dark:bg-blue-500 dark:hover:bg-blue-600"
          >
            Search
          </button>
        </div>

        {loading && (
          <div className="flex justify-center">
            <div className="w-6 h-6 border-4 border-blue-300 border-t-blue-700 rounded-full animate-spin" />
          </div>
        )}
        {error && <p className="text-center text-red-500 font-medium">{error}</p>}

        {weather && (
          <div className="text-center space-y-4 animate-fade-in">
            <h2 className="text-2xl font-semibold text-blue-800 dark:text-blue-300">
              {weather.name}, {weather.sys.country}
            </h2>
            <img
              src={`https://openweathermap.org/img/wn/${weather.weather[0].icon}@4x.png`}
              alt="Weather Icon"
              className="mx-auto"
            />
            <p className="text-5xl font-extrabold text-gray-800 dark:text-gray-200">
              {Math.round(weather.main.temp)}°C
            </p>
            <p className="capitalize text-gray-600 text-lg dark:text-gray-300">
              {weather.weather[0].description}
            </p>
            <div className="grid grid-cols-2 gap-4 text-gray-700 text-sm dark:text-gray-300">
              <p>
                <span className="font-semibold">Humidity:</span>{" "}
                {weather.main.humidity}%
              </p>
              <p>
                <span className="font-semibold">Wind Speed:</span>{" "}
                {weather.wind.speed} m/s
              </p>
            </div>
          </div>
        )}

        {/* 5-Day Forecast */}
        {forecast && (
          <div className="space-y-4">
            <h3 className="text-2xl font-semibold text-blue-800 dark:text-blue-300">5-Day Forecast</h3>
            <div className="grid grid-cols-2 gap-4">
              {forecast.map((day, index) => (
                <div key={index} className="bg-white p-4 rounded-lg shadow-md dark:bg-gray-700 dark:text-white">
                  <p className="font-semibold">{formatDate(day.dt)}</p>
                  <img
                    src={`https://openweathermap.org/img/wn/${day.weather[0].icon}@2x.png`}
                    alt="Weather Icon"
                    className="mx-auto"
                  />
                  <p>{Math.round(day.main.temp)}°C</p>
                  <p>{day.weather[0].description}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
