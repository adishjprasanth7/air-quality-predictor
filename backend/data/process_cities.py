import os
import json
import numpy as np
import pandas as pd

COORDS = {
    'Ahmedabad': {'lat': 23.0225, 'lng': 72.5714, 'state': 'Gujarat', 'region': 'West', 'desc': 'Major commercial and industrial hub in western India.'},
    'Aizawl': {'lat': 23.7271, 'lng': 92.7176, 'state': 'Mizoram', 'region': 'Northeast', 'desc': 'Scenic capital of Mizoram nestled in high verdant hills.'},
    'Amaravati': {'lat': 16.5417, 'lng': 80.5158, 'state': 'Andhra Pradesh', 'region': 'South', 'desc': 'Planned riverfront capital city in Andhra Pradesh.'},
    'Amritsar': {'lat': 31.6340, 'lng': 74.8723, 'state': 'Punjab', 'region': 'North', 'desc': 'Historic cultural center in northern agricultural belt.'},
    'Bengaluru': {'lat': 12.9716, 'lng': 77.5946, 'state': 'Karnataka', 'region': 'South', 'desc': 'India\'s high-tech Silicon Valley on the Deccan Plateau.'},
    'Bhopal': {'lat': 23.2599, 'lng': 77.4126, 'state': 'Madhya Pradesh', 'region': 'Central', 'desc': 'City of Lakes and capital of central state Madhya Pradesh.'},
    'Brajrajnagar': {'lat': 21.8294, 'lng': 83.9213, 'state': 'Odisha', 'region': 'East', 'desc': 'Industrial town with paper mills and coal mining zones.'},
    'Chandigarh': {'lat': 30.7333, 'lng': 76.7794, 'state': 'Chandigarh (UT)', 'region': 'North', 'desc': 'Carefully planned modern union territory near the Shivalik foothills.'},
    'Chennai': {'lat': 13.0827, 'lng': 80.2707, 'state': 'Tamil Nadu', 'region': 'South', 'desc': 'Coastal metropolis with major automotive and port commerce.'},
    'Coimbatore': {'lat': 11.0168, 'lng': 76.9558, 'state': 'Tamil Nadu', 'region': 'South', 'desc': 'Major textile and precision manufacturing center in south India.'},
    'Delhi': {'lat': 28.6139, 'lng': 77.2090, 'state': 'National Capital Region', 'region': 'North', 'desc': 'National capital territory subject to seasonal winter inversions.'},
    'Ernakulam': {'lat': 9.9816, 'lng': 76.2999, 'state': 'Kerala', 'region': 'South', 'desc': 'Commercial core of Kochi with maritime port winds.'},
    'Gurugram': {'lat': 28.4595, 'lng': 77.0266, 'state': 'Haryana', 'region': 'North', 'desc': 'Financial technology and corporate powerhouse in NCR.'},
    'Guwahati': {'lat': 26.1445, 'lng': 91.7362, 'state': 'Assam', 'region': 'Northeast', 'desc': 'Gateway city of Northeast India alongside the Brahmaputra River.'},
    'Hyderabad': {'lat': 17.3850, 'lng': 78.4867, 'state': 'Telangana', 'region': 'South', 'desc': 'Historic tech powerhouse and pharmaceutical production center.'},
    'Jaipur': {'lat': 26.9124, 'lng': 75.7873, 'state': 'Rajasthan', 'region': 'Northwest', 'desc': 'The Pink City on the periphery of the Thar Desert.'},
    'Jorapokhar': {'lat': 23.7088, 'lng': 86.4137, 'state': 'Jharkhand', 'region': 'East', 'desc': 'Coal mining belt and industrial settlement in Dhanbad district.'},
    'Kochi': {'lat': 9.9312, 'lng': 76.2673, 'state': 'Kerala', 'region': 'South', 'desc': 'Coastal spice trade port with humid maritime tropical climate.'},
    'Kolkata': {'lat': 22.5726, 'lng': 88.3639, 'state': 'West Bengal', 'region': 'East', 'desc': 'Historic eastern metropolis on the Hooghly River bank.'},
    'Lucknow': {'lat': 26.8467, 'lng': 80.9462, 'state': 'Uttar Pradesh', 'region': 'North', 'desc': 'Capital of Uttar Pradesh situated in the dense Gangetic plain.'},
    'Mumbai': {'lat': 19.0760, 'lng': 72.8777, 'state': 'Maharashtra', 'region': 'West', 'desc': 'Coastal financial mega-metropolis on the Arabian Sea.'},
    'Patna': {'lat': 25.5941, 'lng': 85.1376, 'state': 'Bihar', 'region': 'East', 'desc': 'Capital city along the Ganges with high winter particulate retention.'},
    'Shillong': {'lat': 25.5788, 'lng': 91.8933, 'state': 'Meghalaya', 'region': 'Northeast', 'desc': 'Hill station in the Khasi Hills famed for clean pine air.'},
    'Talcher': {'lat': 20.9500, 'lng': 85.2200, 'state': 'Odisha', 'region': 'East', 'desc': 'Coal city hosting major open-cast mines and thermal plants.'},
    'Thiruvananthapuram': {'lat': 8.5241, 'lng': 76.9366, 'state': 'Kerala', 'region': 'South', 'desc': 'Southern coastal capital blessed by Arabian Sea breezes.'},
    'Visakhapatnam': {'lat': 17.6868, 'lng': 83.2185, 'state': 'Andhra Pradesh', 'region': 'South', 'desc': 'Major deepwater port and coastal steel manufacturing center.'}
}

STANDARDS = {
    'PM2.5': {'limit': 60.0, 'unit': 'µg/m³', 'name': 'Fine Particulate Matter (PM2.5)'},
    'PM10': {'limit': 100.0, 'unit': 'µg/m³', 'name': 'Coarse Particulates (PM10)'},
    'NO2': {'limit': 80.0, 'unit': 'µg/m³', 'name': 'Nitrogen Dioxide (NO2)'},
    'CO': {'limit': 2.0, 'unit': 'mg/m³', 'name': 'Carbon Monoxide (CO)'},
    'SO2': {'limit': 80.0, 'unit': 'µg/m³', 'name': 'Sulfur Dioxide (SO2)'},
    'O3': {'limit': 100.0, 'unit': 'µg/m³', 'name': 'Ground-Level Ozone (O3)'}
}

def get_aqi_details(aqi_val):
    if aqi_val <= 50:
        return {
            'category': 'Good',
            'color': '#10b981',
            'risk_level': 'Minimal Risk',
            'advisory': 'Air quality is considered satisfactory, and air pollution poses little or no risk.',
            'pollution_rate_label': 'Pristine Atmosphere'
        }
    elif aqi_val <= 100:
        return {
            'category': 'Satisfactory',
            'color': '#84cc16',
            'risk_level': 'Low Risk',
            'advisory': 'Minor breathing discomfort may develop in extremely sensitive or asthmatic individuals.',
            'pollution_rate_label': 'Acceptable Air Quality'
        }
    elif aqi_val <= 200:
        return {
            'category': 'Moderate',
            'color': '#f59e0b',
            'risk_level': 'Moderate Risk',
            'advisory': 'Breathing discomfort to people with lung disease, asthma, and heart conditions upon exertion.',
            'pollution_rate_label': 'Moderate Pollution Rate'
        }
    elif aqi_val <= 300:
        return {
            'category': 'Poor',
            'color': '#f97316',
            'risk_level': 'High Risk',
            'advisory': 'Breathing discomfort to most people on prolonged exposure; avoid strenuous outdoor workouts.',
            'pollution_rate_label': 'High Pollution Rate'
        }
    elif aqi_val <= 400:
        return {
            'category': 'Very Poor',
            'color': '#ef4444',
            'risk_level': 'Very High Risk',
            'advisory': 'Respiratory illness on prolonged exposure. Sensitive groups should remain indoors with filters.',
            'pollution_rate_label': 'Severe Smog Crisis'
        }
    else:
        return {
            'category': 'Severe',
            'color': '#881337',
            'risk_level': 'Critical / Emergency',
            'advisory': 'Severe respiratory emergency! Healthy people experience throat and lung irritation; stay indoors.',
            'pollution_rate_label': 'Hazardous Pollution Disaster'
        }

def process():
    data_path = os.path.join(os.path.dirname(__file__), 'city_day.csv')
    df = pd.read_csv(data_path)
    df['Date'] = pd.to_datetime(df['Date'])
    df['Month'] = df['Date'].dt.month
    df['Year'] = df['Date'].dt.year

    # Overall medians for safe imputing
    overall_medians = {
        'PM2.5': round(float(df['PM2.5'].median()), 1),
        'PM10': round(float(df['PM10'].median()), 1),
        'NO2': round(float(df['NO2'].median()), 1),
        'CO': round(float(df['CO'].median()), 2),
        'SO2': round(float(df['SO2'].median()), 1),
        'O3': round(float(df['O3'].median()), 1),
    }

    month_names = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
    
    cities_output = []

    for city_name, meta in COORDS.items():
        cdf = df[df['City'] == city_name].copy()
        if cdf.empty:
            continue

        total_days = len(cdf)
        valid_aqi_days = int(cdf['AQI'].notnull().sum())

        mean_aqi = float(cdf['AQI'].mean()) if valid_aqi_days > 0 else 100.0
        mean_aqi = round(mean_aqi, 1)

        min_aqi = float(cdf['AQI'].min()) if valid_aqi_days > 0 else 30.0
        max_aqi = float(cdf['AQI'].max()) if valid_aqi_days > 0 else 300.0

        # Recent 2020 average
        c2020 = cdf[cdf['Year'] == 2020]
        recent_aqi = float(c2020['AQI'].mean()) if (not c2020.empty and c2020['AQI'].notnull().sum() > 0) else mean_aqi
        recent_aqi = round(recent_aqi, 1)

        # Monthly seasonal trend
        monthly_series = cdf.groupby('Month')['AQI'].mean()
        monthly_trend = []
        for m in range(1, 13):
            val = monthly_series.get(m, np.nan)
            if np.isnan(val):
                val = mean_aqi
            monthly_trend.append({
                'month': month_names[m - 1],
                'aqi': round(float(val), 1)
            })

        # Pollutants
        pollutants_dict = {}
        ratios = {}
        for p, p_info in STANDARDS.items():
            col_val = cdf[p].mean()
            if pd.isna(col_val):
                col_val = overall_medians[p]
            val = round(float(col_val), 2 if p == 'CO' else 1)
            std_limit = p_info['limit']
            ratio = round((val / std_limit) * 100, 1)
            ratios[p] = ratio

            # Sub-pollutant status
            if ratio <= 60:
                p_status = 'Good (Within Limits)'
                p_status_color = '#10b981'
            elif ratio <= 100:
                p_status = 'Acceptable (Near Limit)'
                p_status_color = '#84cc16'
            elif ratio <= 180:
                p_status = 'Elevated (Exceeds Limit)'
                p_status_color = '#f59e0b'
            elif ratio <= 300:
                p_status = 'Unhealthy (Severe)'
                p_status_color = '#f97316'
            else:
                p_status = 'Critical Hazard'
                p_status_color = '#ef4444'

            pollutants_dict[p] = {
                'value': val,
                'standard': std_limit,
                'unit': p_info['unit'],
                'fullName': p_info['name'],
                'percentOfLimit': ratio,
                'status': p_status,
                'statusColor': p_status_color
            }

        # Identify dominant pollutant (highest ratio over safe limit)
        dominant_pollutant = max(ratios, key=ratios.get)
        dominant_ratio = ratios[dominant_pollutant]

        # Categorization based on mean AQI
        aqi_info = get_aqi_details(mean_aqi)

        # Category bucket breakdown
        bucket_counts = cdf['AQI_Bucket'].value_counts(normalize=True).to_dict()
        bucket_percentages = {
            'Good': round(bucket_counts.get('Good', 0) * 100, 1),
            'Satisfactory': round(bucket_counts.get('Satisfactory', 0) * 100, 1),
            'Moderate': round(bucket_counts.get('Moderate', 0) * 100, 1),
            'Poor': round(bucket_counts.get('Poor', 0) * 100, 1),
            'Very Poor': round(bucket_counts.get('Very Poor', 0) * 100, 1),
            'Severe': round(bucket_counts.get('Severe', 0) * 100, 1),
        }

        city_record = {
            'id': city_name.lower().replace(' ', '-'),
            'city': city_name,
            'state': meta['state'],
            'region': meta['region'],
            'description': meta['desc'],
            'lat': meta['lat'],
            'lng': meta['lng'],
            'aqi': mean_aqi,
            'recent_aqi': recent_aqi,
            'min_aqi': round(min_aqi, 1),
            'max_aqi': round(max_aqi, 1),
            'category': aqi_info['category'],
            'color': aqi_info['color'],
            'risk_level': aqi_info['risk_level'],
            'health_advisory': aqi_info['advisory'],
            'pollution_rate_label': aqi_info['pollution_rate_label'],
            'dominant_pollutant': dominant_pollutant,
            'dominant_pollutant_ratio': dominant_ratio,
            'pollutants': pollutants_dict,
            'bucket_percentages': bucket_percentages,
            'total_observations': total_days,
            'valid_aqi_observations': valid_aqi_days,
            'monthly_trend': monthly_trend
        }
        cities_output.append(city_record)

    # Sort descending by AQI for rankings
    cities_output.sort(key=lambda x: x['aqi'], reverse=True)
    for rank, item in enumerate(cities_output, start=1):
        item['rank'] = rank

    # Write JSON to backend
    json_path = os.path.join(os.path.dirname(__file__), 'cities_pollution_summary.json')
    with open(json_path, 'w', encoding='utf-8') as f:
        json.dump(cities_output, f, indent=2)
    print(f"Wrote {len(cities_output)} cities summary to {json_path}")

    # Write JS to frontend/src/data/citiesData.js
    frontend_data_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..', 'frontend', 'src', 'data'))
    os.makedirs(frontend_data_dir, exist_ok=True)
    js_path = os.path.join(frontend_data_dir, 'citiesData.js')
    
    with open(js_path, 'w', encoding='utf-8') as f:
        f.write("/**\n * Authentically computed CPCB Monitored Cities & Pollution Rates Dataset\n */\n")
        f.write("export const CITIES_POLLUTION_DATA = ")
        json.dump(cities_output, f, indent=2)
        f.write(";\n\nexport default CITIES_POLLUTION_DATA;\n")
    print(f"Wrote frontend dataset to {js_path}")

if __name__ == '__main__':
    process()
