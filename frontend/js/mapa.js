// Crear el mapa centrado
var map = L.map('map').setView([52.5200, 13.4050], 13);  // Berlín

// Añadir el mapa base de OpenStreetMap
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
}).addTo(map);

// Añadir un marcador de ejemplo
var marker = L.marker([52.5200, 13.4050]).addTo(map);

// Añadir un círculo para representar una región
var circle = L.circle([52.5186, 13.4081], {
    color: 'blue',
    fillColor: '#f03',
    fillOpacity: 0.5,
    radius: 500
}).addTo(map);

// Añadir una línea poligonal
var polyline = L.polyline([
    [52.5186, 13.4081],
    [52.5200, 13.4050],
    [52.5218, 13.4019]
], {color: 'orange'}).addTo(map);