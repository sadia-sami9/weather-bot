const express = require("express");
const axios = require("axios");
const bodyParser = require("body-parser");

const app = express();
app.use(bodyParser.json());

const API_KEY = "ef321c43f0cec3563b13a86df7d805f3";


app.get("/", (req, res) => {
  res.send("Server is working");
});


app.post("/webhook", async (req, res) => {


  console.log("Webhook hit");
console.log(JSON.stringify(req.body, null, 2));



  const intent = req.body.queryResult.intent.displayName;
  // const city = req.body.queryResult.parameters["geo-city"];
  const city = req.body.queryResult.parameters["geo-city"] || req.body.queryResult.parameters["geo_city"];
  const date = req.body.queryResult.parameters["date"];
try {
  
  // STEP 1: Get coordinates
  const geo = await axios.get(
    `http://api.openweathermap.org/geo/1.0/direct?q=${city}&limit=1&appid=${API_KEY}`
  );

  const lat = geo.data[0].lat;
  const lon = geo.data[0].lon;

  // STEP 2: One Call API
  const weather = await axios.get(
    `https://api.openweathermap.org/data/3.0/onecall?lat=${lat}&lon=${lon}&units=metric&appid=${API_KEY}`
  );

  // CURRENT WEATHER
  if (intent === "current.weather") {
    const temp = weather.data.current.temp;
    const desc = weather.data.current.weather[0].description;

    return res.json({
      fulfillmentText: `Current weather in ${city}: ${temp}°C, ${desc}`
    });
  }

  // FORECAST LOGIC (WITH DATE)
  if (intent === "weather.forecast") {
    let startIndex = 0;

    if (date) {
      // const userDate = new Date(date);
      const userDate = new Date(date.split("T")[0]);
      const today = new Date();

      const diffTime = userDate - today;
      const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

      if (diffDays > 0 && diffDays < 8) {
        startIndex = diffDays;
      }
    }

    const daily = weather.data.daily.slice(startIndex, startIndex + 8);

    let forecastText = `Forecast for ${city}:\n`;

    // daily.forEach((day, i) => {
    //   forecastText += `Day ${i + 1}: ${day.temp.day}°C, ${day.weather[0].description}\n`;
    // });

    daily.forEach((day) => {
  const dateObj = new Date(day.dt * 1000);
  const readableDate = dateObj.toDateString();

  forecastText += `${readableDate}: ${day.temp.day}°C, ${day.weather[0].description}\n`;
});

    return res.json({
      fulfillmentText: forecastText
    });
  }

} catch (error) {
  console.log(error.message);
  return res.json({
    fulfillmentText: "Error fetching weather data"
  });
}



});

app.listen(3000, () => console.log("Server running on port 3000"));