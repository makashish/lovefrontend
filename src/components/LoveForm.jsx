import React, { useState, useEffect } from "react";
import axios from "axios";
import "./LoveForm.css";
import heart from "../assets/heart.png";

let API_BASE = null;

const callLoveAPI = async (route, payload) => {
  try {
    const response = await axios.post(`${API_BASE}/${route}`, payload);
    return response.data;
  } catch (error) {
    console.error("API Error:", error);
    return { error: "Server Error or Invalid Input" };
  }
};

const LoveForm = () => {
  const [mode, setMode] = useState("name");
  const [form, setForm] = useState({});
  const [location, setLocation] = useState({ lat: null, lon: null });
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [configLoaded, setConfigLoaded] = useState(false);

  // Load config.json on start
  useEffect(() => {
    fetch("/config.json")
      .then(res => res.json())
      .then(data => {
        API_BASE = data.API_BASE_URL;
        setConfigLoaded(true);
      })
      .catch(err => console.error("Config load error:", err));
  }, []);

  // 📍 Get location
  useEffect(() => {
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const lat = parseFloat(pos.coords.latitude.toFixed(1));
        const lon = parseFloat(pos.coords.longitude.toFixed(1));
        setLocation({ lat, lon });
      },
      () => {
        setLocation({ lat: 26.8, lon: 82.2 });
        console.warn("Location blocked. Using Ayodhya.");
      }
    );
  }, []);

  const formatDOB = (date, time) => {
    if (!date || !time) return "";
    return `${date} ${time}`;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!configLoaded) {
      alert("Config not loaded yet!");
      return;
    }

    setLoading(true);
    setResult(null);

    if (location.lat === null || location.lon === null) {
      alert("Location not available, using Ayodhya.");
      setLocation({ lat: 26.8, lon: 82.2 });
    }

    let endpoint = "";
    let payload = {};

    if (mode === "name") {
      endpoint = "name-match";
      payload = { name1: form.name1, name2: form.name2 };
    } else {
      endpoint = mode === "rashi" ? "rashi-match" : "lagna-match";
      payload = {
        name1: form.name1,
        dob1: formatDOB(form.dob1, form.time1),
        lat1: location.lat,
        lon1: location.lon,
        name2: form.name2,
        dob2: formatDOB(form.dob2, form.time2),
        lat2: location.lat,
        lon2: location.lon,
      };
    }

    const resData = await callLoveAPI(endpoint, payload);
    setResult(resData);
    setLoading(false);
  };

  if (!configLoaded) return <p>Loading config...</p>;

  return (
    <div className="page">
      <div className="form-container">
        <img src={heart} className="heart-img" alt="Love" />

        <div className="mode-buttons">
          <button onClick={() => setMode("name")} className={mode === "name" ? "active" : ""}>
            Name Compatibility
          </button>
          <button onClick={() => setMode("rashi")} className={mode === "rashi" ? "active" : ""}>
            Rashi Compatibility
          </button>
          <button onClick={() => setMode("lagna")} className={mode === "lagna" ? "active" : ""}>
            Lagna Compatibility
          </button>
        </div>

        <form onSubmit={handleSubmit} className="love-form">
          {mode === "name" ? (
            <>
              <input type="text" placeholder="Name Boy" onChange={e => setForm({ ...form, name1: e.target.value })} required />
              <input type="text" placeholder="Name Girl" onChange={e => setForm({ ...form, name2: e.target.value })} required />
            </>
          ) : (
            <>
              <input type="text" placeholder="Name Boy" onChange={e => setForm({ ...form, name1: e.target.value })} required />
              <input type="date" onChange={e => setForm({ ...form, dob1: e.target.value })} required />
              <input type="time" onChange={e => setForm({ ...form, time1: e.target.value })} required />
              <input type="text" placeholder="Name Girl" onChange={e => setForm({ ...form, name2: e.target.value })} required />
              <input type="date" onChange={e => setForm({ ...form, dob2: e.target.value })} required />
              <input type="time" onChange={e => setForm({ ...form, time2: e.target.value })} required />
            </>
          )}

          <button type="submit" className="submit-btn" disabled={loading}>
            {loading ? "🔍 Checking..." : "❤️ Check Compatibility"}
          </button>
        </form>

        {result && !result.error && (
          <div className="result-box">
            {result.name1 && result.name2 && (
              <h2>❤️ {result.name1} & {result.name2}</h2>
            )}
            {result.compatibility_percent !== undefined && (
              <p>
                Score: <strong>{result.compatibility_percent}%</strong>
              </p>
            )}
            {result.description && <p>{result.description}</p>}
            {!result.name1 && !result.description && !result.compatibility_percent && (
              <p>⚠ No data received from server. Try again or check inputs.</p>
            )}
          </div>
        )}

        {result && result.error && (
          <div className="result-box error">
            <p>❌ {result.error}</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default LoveForm;