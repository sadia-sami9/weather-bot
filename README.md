# Weather Chatbot (Dialogflow + Node.js)

##  Overview

This project is a weather chatbot built using Dialogflow ES, a Node.js webhook, and OPenWeather API.
It provides users with:

*  Current weather information
*  8-day weather forecast

The bot integrates with the OpenWeather API and returns clean, user-friendly responses.



##  Features

###  Current Weather

* Temperature (with feels like)
* Weather condition
* Humidity
* Wind speed
* Visibility

###  Weather Forecast (Up to 8 Days)

* Date-wise forecast
* Temperature (day, min, max, feels like)
* Weather condition
* Humidity
* Wind speed

###  Smart Handling

* Supports user-provided dates
* Validates forecast range (max 8 days)
* Handles invalid city inputs
* Clean formatted responses for chatbot UI



##  Key Implementation Details

###  Optimized API Usage

* Uses Current Weather API (2.5) for real-time weather → lightweight
* Uses One Call API (3.0) only for forecast → efficient
* Avoids unnecessary data using:

  ```
  exclude=minutely,hourly,alerts
  ```


###  Date Handling Logic

* Converts user input date to local format
* Calculates difference from current date
* Maps it to the correct forecast day index



##  Tech Stack

* Node.js
* Express.js
* Axios
* Dialogflow
* OpenWeather API

---

##  Project Structure

```
project-folder/
│
├── index.js
├── package.json
├── package-lock.json
├── .env
├── .gitignore
└── node_modules/
```

---

##  Environment Variables

Create a `.env` file in the root directory:

```
API_KEY=your_openweather_api_key
```

---

##  How to Run

### 1. Install dependencies

```
npm install
```

### 2. Start server

```
node index.js
```

### 3. Expose using ngrok

```
ngrok http 3000
```

Use the generated HTTPS URL in Dialogflow webhook settings.

---

## 🔗 API Endpoints Used

### Current Weather

```
https://api.openweathermap.org/data/2.5/weather
```

### Forecast (One Call 3.0)

```
https://api.openweathermap.org/data/3.0/onecall
```

### Geocoding API

```
http://api.openweathermap.org/geo/1.0/direct
```

---


