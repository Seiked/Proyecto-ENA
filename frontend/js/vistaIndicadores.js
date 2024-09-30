let currentId = 1;
let charts = {};

function createChart(canvasId, title, labels) {
    const ctx = document.getElementById(canvasId).getContext('2d');
    return new Chart(ctx, {
        type: 'line',
        data: {
            labels: ['T0', 'T1', 'T2', 'T3', 'T4'], // Puntos en el tiempo para el eje X
            datasets: labels.map(label => ({
                label: label,
                borderColor: `rgb(${Math.floor(Math.random() * 255)}, ${Math.floor(Math.random() * 255)}, ${Math.floor(Math.random() * 255)})`,
                tension: 0.1
            }))
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                title: {
                    display: true,
                    text: title
                }
            },
            scales: {
                y: {
                    beginAtZero: true
                }
            }
        }
    });
}

function initCharts() {
    charts.magnetometro = createChart('magnetometroChart', 'Magnetómetro', ['mag_x', 'mag_y', 'mag_z']);
    charts.giroscopio = createChart('giroscopioChart', 'Giroscopio', ['giro_x', 'giro_y', 'giro_z']);
    charts.acelerometro = createChart('acelerometroChart', 'Acelerómetro', ['acel_x', 'acel_y', 'acel_z']);
    charts.gps = createChart('gpsChart', 'GPS', ['gps_lat', 'gps_lon']);
    
    // Gráficas separadas para barómetro, ruido y vibración
    charts.barometro = createChart('barometroChart', 'Barómetro', ['barometro']);
    charts.ruido = createChart('ruidoChart', 'Ruido', ['ruido']);
    charts.vibracion = createChart('vibracionChart', 'Vibración', ['vibracion']);
}

function updateCharts(data) {
    Object.keys(charts).forEach(key => {
        const chart = charts[key];
        chart.data.datasets.forEach(dataset => {
            // Agrega nuevos datos y elimina los más antiguos si hay más de 5 puntos
            dataset.data.push(data[dataset.label]);
            if (dataset.data.length > 5) {
                dataset.data.shift(); // Elimina el valor más antiguo
            }
        });
        chart.update();
    });
}

async function fetchData() {
    try {
        const response = await fetch('http://localhost:8000/api/v1/api/sensor-data/');
        const data = await response.json();
        const currentData = data.find(item => item.id === currentId);
        if (currentData) {
            updateCharts(currentData);
        }
        currentId = (currentId % 26) + 1;
    } catch (error) {
        console.error('Error fetching data:', error);
    }
}

document.addEventListener('DOMContentLoaded', function() {
    initCharts();
    fetchData();
    setInterval(fetchData, 10000); // Actualiza cada 10 segundos
});