require("dotenv").config();
const express = require("express");
const axios = require("axios");

//server instance
const app = express();
//json parsing
app.use(express.json());

const API_KEY = process.env.API_KEY;

//test endpoint for server
app.get("/", (req, res) => {
  res.send("Server is working");
});

//main webhook where req is sent from dialogflow
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
        `https://api.openweathermap.org/data/2.5/weather?q=${city}&units=metric&appid=${API_KEY}`,
      );

      const data = weather.data;
      // Dialogflow’s text response does not reliably render newline characters in the UI.
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
        `http://api.openweathermap.org/geo/1.0/direct?q=${city}&limit=1&appid=${API_KEY}`,
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
        `https://api.openweathermap.org/data/3.0/onecall?lat=${lat}&lon=${lon}&units=metric&exclude=minutely,hourly,alerts&appid=${API_KEY}`,
      );

      let startIndex = 0;

      if (date) {
        //removes timezone issues
        const userDate = new Date(date.split("T")[0]);
        const today = new Date();

        // normalize BOTH to LOCAL midnight (not UTC) to prevent one day off
        userDate.setHours(0, 0, 0, 0);
        today.setHours(0, 0, 0, 0);

        const diffTime = userDate.getTime() - today.getTime();
        //calculate how many days ahead
        const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));

        if (diffDays >= 0 && diffDays < 8) {
          //picks correct day from forecast array
          startIndex = diffDays;
        } else {
          return res.json({
            fulfillmentText: `Sorry, I can only provide forecast for up to 8 days from today.`,
          });
        }
      }
      //gets relevant days
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

      //sending multiple messages for clean UI
      return res.json({
        fulfillmentMessages: messages.map((msg) => ({
          text: { text: [msg] },
        })),
      });
    }
    
    //error handling to prevent crash
  } catch (error) {
    console.log(error.message);
    return res.json({
      fulfillmentText: "Error fetching weather data",
    });
  }
});
//start server
app.listen(3000, () => console.log("Server running on port 3000"));
