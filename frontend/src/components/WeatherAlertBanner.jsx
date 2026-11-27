export default function WeatherAlertBanner({ alert }) {
  if (!alert) return null;

  return (
    <section
      className={`weather-card ${alert.risk_level === "High" ? "risk-high" : "risk-mod"}`}
      aria-label="Weather Disease Advisory"
    >
      <div className="weather-top">
        <strong>
          Weather Advisory — {alert.location} (Risk: {alert.risk_level})
        </strong>
        <span className="weather-metrics">
          Humidity: {alert.humidity_percent}% | Temp: {alert.temperature_c}°C
        </span>
      </div>
      <p>{alert.advisory} {alert.recommended_action}</p>
    </section>
  );
}
