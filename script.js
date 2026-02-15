        /* --- 3. LOGIC (Put this in script.js) --- */
        
        const apiKey = ""; 
        const WEATHER_API_KEY = "c26d7b3bb203a5245f59f2c3783a13aa"; 

        const elements = {
            input: document.getElementById('city-input'),
            btn: document.getElementById('search-btn'),
            geoBtn: document.getElementById('geo-btn'),
            loader: document.getElementById('loader'),
            cityName: document.getElementById('city-name'),
            temp: document.getElementById('main-temp'),
            desc: document.getElementById('weather-description'),
            feelsLike: document.getElementById('feels-like'),
            humidity: document.getElementById('humidity'),
            wind: document.getElementById('wind-speed'),
            visibility: document.getElementById('visibility'),
            sunrise: document.getElementById('sunrise'),
            sunset: document.getElementById('sunset'),
            tempMax: document.getElementById('temp-max'),
            tempMin: document.getElementById('temp-min'),
            bg: document.getElementById('dynamic-bg'),
            animLayer: document.getElementById('animation-layer'),
            toast: document.getElementById('error-toast'),
            toastMsg: document.getElementById('error-message'),
            aiSummary: document.getElementById('ai-summary'),
            hourlyList: document.getElementById('hourly-list'),
            logoIcon: document.getElementById('logo-icon')
        };

        document.getElementById('current-date').innerText = new Date().toLocaleDateString('en-US', {
            weekday: 'long', day: 'numeric', month: 'long'
        });

        function requestLiveLocation() {
            if (navigator.geolocation) {
                elements.loader.classList.remove('hidden');
                navigator.geolocation.getCurrentPosition(
                    (p) => fetchWeatherByCoords(p.coords.latitude, p.coords.longitude),
                    () => fetchWeather('Vaishali')
                );
            } else {
                fetchWeather('Vaishali');
            }
        }

        async function fetchWeatherByCoords(lat, lon) {
            elements.loader.classList.remove('hidden');
            try {
                const res = await fetch(`https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&units=metric&appid=${WEATHER_API_KEY}`);
                const data = await res.json();
                updateUI(data);
                fetchHourlyForecastByCoords(lat, lon);
                getAISummary(data);
            } catch (e) { showError("Sync Failure"); }
            finally { elements.loader.classList.add('hidden'); }
        }

        async function fetchWeather(city) {
            if (!city) return;
            elements.loader.classList.remove('hidden');
            try {
                const res = await fetch(`https://api.openweathermap.org/data/2.5/weather?q=${city}&units=metric&appid=${WEATHER_API_KEY}`);
                if (!res.ok) throw new Error();
                const data = await res.json();
                updateUI(data);
                fetchHourlyForecast(city);
                getAISummary(data);
            } catch (e) { showError("Sector Not Identified"); }
            finally { elements.loader.classList.add('hidden'); }
        }

        async function fetchHourlyForecast(city) {
            const res = await fetch(`https://api.openweathermap.org/data/2.5/forecast?q=${city}&units=metric&cnt=8&appid=${WEATHER_API_KEY}`);
            const data = await res.json();
            updateHourlyUI(data.list);
        }

        async function fetchHourlyForecastByCoords(lat, lon) {
            const res = await fetch(`https://api.openweathermap.org/data/2.5/forecast?lat=${lat}&lon=${lon}&units=metric&cnt=8&appid=${WEATHER_API_KEY}`);
            const data = await res.json();
            updateHourlyUI(data.list);
        }

        function updateHourlyUI(forecasts) {
            elements.hourlyList.innerHTML = '';
            forecasts.forEach(item => {
                const date = new Date(item.dt * 1000);
                let h = date.getHours();
                const ampm = h >= 12 ? 'PM' : 'AM';
                h = h % 12 || 12;
                const timeLabel = `${h} ${ampm}`;
                const icon = getIconClass(item.weather[0].main);

                const div = document.createElement('div');
                div.className = "flex items-center justify-between py-3 border-b border-white/5 last:border-0";
                div.innerHTML = `
                    <span class="text-[10px] font-black opacity-30 uppercase tracking-widest">${timeLabel}</span>
                    <i class="${icon} text-cyan-400 text-xl"></i>
                    <span class="font-black text-xl font-space">${Math.round(item.main.temp)}°C</span>
                `;
                elements.hourlyList.appendChild(div);
            });
        }

        function getIconClass(w) {
            w = w.toLowerCase();
            if (w.includes('clear')) return 'fas fa-sun';
            if (w.includes('cloud')) return 'fas fa-cloud-sun';
            if (w.includes('rain')) return 'fas fa-cloud-showers-heavy';
            if (w.includes('thunder')) return 'fas fa-bolt-lightning';
            return 'fas fa-cloud';
        }

        function updateUI(data) {
            elements.cityName.innerText = data.name.toUpperCase();
            elements.temp.innerText = Math.round(data.main.temp) + "°C";
            elements.desc.innerText = data.weather[0].description;
            elements.feelsLike.innerText = Math.round(data.main.feels_like) + "°C";
            elements.humidity.innerText = data.main.humidity + "%";
            elements.wind.innerText = Math.round(data.wind.speed * 3.6) + " KM/H";
            elements.visibility.innerText = (data.visibility / 1000).toFixed(1) + " KM";
            elements.tempMax.innerText = Math.round(data.main.temp_max) + "°C";
            elements.tempMin.innerText = Math.round(data.main.temp_min) + "°C";
            elements.sunrise.innerText = formatTime(data.sys.sunrise, data.timezone);
            elements.sunset.innerText = formatTime(data.sys.sunset, data.timezone);
            elements.logoIcon.className = `${getIconClass(data.weather[0].main)} text-2xl md:text-4xl text-cyan-400 animate-pulse-slow`;
            updateVisuals(data.weather[0].main.toLowerCase());
        }

        function formatTime(u, t) {
            const d = new Date((u + t) * 1000);
            return d.getUTCHours().toString().padStart(2, '0') + ":" + d.getUTCMinutes().toString().padStart(2, '0');
        }

        function updateVisuals(c) {
            elements.bg.className = 'weather-bg';
            elements.animLayer.innerHTML = '';
            if (c.includes('clear')) { elements.bg.classList.add('state-clear'); createFlare(); }
            else if (c.includes('cloud')) elements.bg.classList.add('state-clouds');
            else if (c.includes('rain')) { elements.bg.classList.add('state-rain'); createRain(); }
        }

        function createRain() {
            for (let i = 0; i < 40; i++) {
                const drop = document.createElement('div');
                drop.className = 'raindrop';
                drop.style.left = Math.random() * 100 + 'vw';
                drop.style.animationDuration = (Math.random() * 0.4 + 0.3) + 's';
                elements.animLayer.appendChild(drop);
            }
        }

        function createFlare() {
            const flare = document.createElement('div');
            flare.className = 'sun-flare';
            elements.animLayer.appendChild(flare);
        }

        async function getAISummary(data) {
            if (!apiKey) {
                elements.aiSummary.innerText = `Sector ${data.name}: ${data.weather[0].description} at ${Math.round(data.main.temp)}°C. Stability nominal.`;
                return;
            }
            const p = `Write a short 1-sentence cyberpunk atmospheric report for ${data.name}: ${data.main.temp}°C, ${data.weather[0].description}.`;
            try {
                const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-09-2025:generateContent?key=${apiKey}`, {
                    method: 'POST', headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ contents: [{ parts: [{ text: p }] }] })
                });
                const r = await res.json();
                elements.aiSummary.innerText = `"${r.candidates[0].content.parts[0].text.trim()}"`;
            } catch (e) { elements.aiSummary.innerText = "Data stream stabilized."; }
        }

        function showError(m) {
            elements.toastMsg.innerText = m;
            elements.toast.classList.remove('translate-y-48');
            setTimeout(() => elements.toast.classList.add('translate-y-48'), 4000);
        }

        elements.btn.onclick = () => fetchWeather(elements.input.value.trim());
        elements.input.onkeypress = (e) => { if (e.key === 'Enter') fetchWeather(elements.input.value.trim()); };
        elements.geoBtn.onclick = () => requestLiveLocation();
        window.onload = requestLiveLocation;