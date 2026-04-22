require("dotenv").config();
const express = require("express");
const axios = require("axios");


const app = express();
app.use(express.json());

const API_KEY = process.env.API_KEY;

app.get("/", (req, res) => {
  res.send("Server is working");
});

app.post("/webhook", async (req, res) => {
  console.log("Webhook hit");
  console.log(JSON.stringify(req.body, null, 2));

  const intent = req.body.queryResult.intent.displayName;
  
  const city =
    req.body.queryResult.parameters["geo-city"] ||
    req.body.queryResult.parameters["geo_city"];
  const date = req.body.queryResult.parameters["date"];
  try {
   
    if (intent === "current.weather") {

  //  Call CURRENT WEATHER API (2.5)
  const weather = await axios.get(
    `https://api.openweathermap.org/data/2.5/weather?q=${city}&units=metric&appid=${API_KEY}`
  );

  const data = weather.data;

  const messages = [
    `Current weather in ${city}`,
    `🌡 Temperature: ${data.main.temp}°C (feels like ${data.main.feels_like}°C)`,
    `🌤 Condition: ${data.weather[0].description}`,
    `💧 Humidity: ${data.main.humidity}%`,
    `🌬 Wind Speed: ${data.wind.speed} m/s`,
    `👁 Visibility: ${data.visibility} meters`,
  ];

  return res.json({
    fulfillmentMessages: messages.map((msg) => ({
      text: { text: [msg] },
    })),
  });
}

    // FORECAST LOGIC (WITH DATE)
    if (intent === "weather.forecast") {

// STEP 1: Get coordinates (ONLY for forecast)
const geo = await axios.get(
  `http://api.openweathermap.org/geo/1.0/direct?q=${city}&limit=1&appid=${API_KEY}`
);

if (!geo.data.length) {
  return res.json({
    fulfillmentText: `Sorry, I couldn't find that city.`,
  });
}

const lat = geo.data[0].lat;
const lon = geo.data[0].lon;

// STEP 2: One Call API (forecast)
const weather = await axios.get(
  `https://api.openweathermap.org/data/3.0/onecall?lat=${lat}&lon=${lon}&units=metric&exclude=minutely,hourly,alerts&appid=${API_KEY}`
);



      let startIndex = 0;

      if (date) {
        const userDate = new Date(date.split("T")[0]);
        const today = new Date();

        // normalize BOTH to LOCAL midnight (not UTC)
        userDate.setHours(0, 0, 0, 0);
        today.setHours(0, 0, 0, 0);

        const diffTime = userDate.getTime() - today.getTime();
        const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));

        if (diffDays >= 0 && diffDays < 8) {
          startIndex = diffDays;
        } else {
          return res.json({
            fulfillmentText: `Sorry, I can only provide forecast for up to 8 days from today.`,
          });
        }
      }

      const daily = weather.data.daily.slice(startIndex, startIndex + 8);

      const messages = [];

      messages.push(`Forecast for ${city}:`);

      daily.forEach((day) => {
        const dateObj = new Date(day.dt * 1000);
        const readableDate = dateObj.toDateString();

        messages.push(
          `${readableDate}
🌡 Temp: ${day.temp.day}°C (feels like ${day.feels_like.day}°C)
🌤 Condition: ${day.weather[0].description}
💧 Humidity: ${day.humidity}%
🌬 Wind: ${day.wind_speed} m/s`,
        );
      });

      return res.json({
        fulfillmentMessages: messages.map((msg) => ({
          text: { text: [msg] },
        })),
      });
    }
  } catch (error) {
    console.log(error.message);
    return res.json({
      fulfillmentText: "Error fetching weather data",
    });
  }
});

app.listen(3000, () => console.log("Server running on port 3000"));
