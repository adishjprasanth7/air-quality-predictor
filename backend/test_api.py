import urllib.request
import json

def test():
    print("--- 1. Testing GET / ---")
    with urllib.request.urlopen("http://127.0.0.1:8000/") as resp:
        print("Status:", resp.status)
        print("Response:", json.loads(resp.read().decode()))

    print("\n--- 2. Testing GET /health ---")
    with urllib.request.urlopen("http://127.0.0.1:8000/health") as resp:
        print("Status:", resp.status)
        print("Response:", json.loads(resp.read().decode()))

    print("\n--- 3. Testing GET /model-info ---")
    with urllib.request.urlopen("http://127.0.0.1:8000/model-info") as resp:
        print("Status:", resp.status)
        data = json.loads(resp.read().decode())
        print("Model Name:", data["model_name"])
        print("Best R2:", data["best_metrics"]["R2_Score"])

    print("\n--- 4. Testing POST /predict ---")
    payload = {
        "PM2.5": 55.4,
        "PM10": 110.2,
        "NO2": 34.5,
        "CO": 1.05,
        "SO2": 12.3,
        "O3": 29.8
    }
    req = urllib.request.Request(
        "http://127.0.0.1:8000/predict",
        data=json.dumps(payload).encode("utf-8"),
        headers={"Content-Type": "application/json"},
        method="POST"
    )
    with urllib.request.urlopen(req) as resp:
        print("Status:", resp.status)
        prediction = json.loads(resp.read().decode())
        print("Predicted AQI:", prediction["predicted_aqi"])
        print("Category:", prediction["category"])
        print("Risk Level:", prediction["risk_level"])
        print("Advisory:", prediction["health_advisory"])

    print("\n--- 5. Testing GET /predictions ---")
    with urllib.request.urlopen("http://127.0.0.1:8000/predictions") as resp:
        print("Status:", resp.status)
        history = json.loads(resp.read().decode())
        print("Total Records in DB:", history["total_records"])
        print("Latest Stored Record:", history["history"][0]["predicted_aqi"], history["history"][0]["category"])

    print("\n--- 6. Testing GET /security-status ---")
    with urllib.request.urlopen("http://127.0.0.1:8000/security-status") as resp:
        print("Status:", resp.status)
        sec = json.loads(resp.read().decode())
        print("Rate Limiter:", sec["protections"]["rate_limiter"]["enabled"])
        print("Security Headers Count:", len(sec["protections"]["security_headers"]["headers"]))
        print("Payload Guard Cap:", sec["protections"]["payload_guard"]["max_allowed_bytes"], "bytes")

    print("\n--- 7. Testing GET /cities ---")
    with urllib.request.urlopen("http://127.0.0.1:8000/cities") as resp:
        print("Status:", resp.status)
        cities_data = json.loads(resp.read().decode())
        print("Total Cities:", cities_data["total_cities"])
        print("National Mean AQI:", cities_data["national_mean_aqi"])
        print("Most Polluted:", cities_data["most_polluted"])
        print("Cleanest:", cities_data["cleanest"])

    print("\n--- 8. Testing GET /cities/delhi ---")
    with urllib.request.urlopen("http://127.0.0.1:8000/cities/delhi") as resp:
        print("Status:", resp.status)
        delhi = json.loads(resp.read().decode())
        print("City:", delhi["city"], "| Mean AQI:", delhi["aqi"], "| Category:", delhi["category"])
        print("Dominant Pollutant:", delhi["dominant_pollutant"])

    print("\nALL 8 API ENDPOINTS TESTED AND VERIFIED SUCCESSFULLY!")

if __name__ == "__main__":
    test()
