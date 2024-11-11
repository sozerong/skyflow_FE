// src/App.js
import React, { useState, useCallback } from 'react';
import { MapContainer, TileLayer, Marker, Polyline, useMapEvents } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import axios from 'axios';

// Leaflet의 마커 이미지 설정
import L from 'leaflet';
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';

const defaultIcon = L.icon({
  iconUrl: markerIcon,
  shadowUrl: markerShadow,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

L.Marker.prototype.options.icon = defaultIcon;

function MapWithClick({ sendCoordinates }) {
  const [position, setPosition] = useState(null);

  useMapEvents({
    click(e) {
      const { lat, lng } = e.latlng;
      setPosition([lat, lng]);
      sendCoordinates(lat, lng);
    },
  });

  return (
    <>
      {position && <Marker position={position} />}
    </>
  );
}

function App() {
  const [mode, setMode] = useState("future"); // 기본 모드 설정
  const [markers, setMarkers] = useState([]); // 서버에서 반환된 위치 저장
  const [time, setTime] = useState(""); // 입력받은 시간을 저장하는 상태

  // 좌표를 서버로 전송하는 함수
  const sendCoordinates = useCallback((lat, lng) => {
    // 시간을 포맷하여 분과 초를 00으로 설정
    const formattedTime = time ? `${time.slice(0, 16)}:00` : "";

    axios.post("http://localhost:8000/api/predict/", {
      latitude: lat,
      longitude: lng,
      direction: mode, // mode 값 사용
      time: formattedTime, // 포맷된 시간 사용
    })
    .then(response => {
      console.log("서버 응답:", response.data);
      const newMarkers = Object.values(response.data).map(item => [item.latitude, item.longitude]);
      setMarkers(newMarkers);
    })
    .catch(error => {
      console.error("서버 오류:", error);
    });
  }, [mode, time]); // mode와 time 상태가 변경될 때마다 함수가 업데이트되도록 설정

  // 모드 토글 함수
  const toggleMode = () => {
    setMode(prevMode => (prevMode === "future" ? "past" : "future"));
  };

  // 시간 입력 핸들러
  const handleTimeChange = (event) => {
    setTime(event.target.value);
  };

  return (
    <div style={{ width: '100vw', height: '100vh', position: 'relative' }}>
      <MapContainer center={[37.5665, 126.9780]} zoom={13} style={{ width: '100%', height: '100%' }}>
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        />
        <MapWithClick sendCoordinates={sendCoordinates} />

        {markers.map((position, index) => (
          <Marker key={index} position={position} />
        ))}
        
        {markers.length > 1 && (
          <Polyline positions={markers} color="blue" />
        )}
      </MapContainer>

      {/* 우측 상단 모드 토글 버튼과 시간 입력 필드 */}
      <div style={{ position: 'absolute', top: '80px', left: '10px', zIndex: 1000 }}>
        <input
          type="datetime-local"
          value={time}
          onChange={handleTimeChange}
          placeholder="시간 입력"
          style={{ padding: '5px', marginTop: '10px', width: '150px' }}
        />
      </div>
    </div>
  );
}

export default App;
