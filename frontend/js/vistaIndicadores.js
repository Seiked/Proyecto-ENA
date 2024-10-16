let currentId = 1;
let charts = {};
let statistics = {};

function createChart(canvasId, title, labels) {
    const ctx = document.getElementById(canvasId).getContext('2d');

    const excludedCharts = ['ruido', 'barometro', 'vibracion'];
    const includeIndLine = !excludedCharts.some(ex => canvasId.includes(ex));

    // Create an array of 10 elements representing the last 90 seconds
    const timeLabels = Array.from({length: 10}, (_, i) => {
        const seconds = i * 10;
        return `${Math.floor(seconds / 60)}:${(seconds % 60).toString().padStart(2, '0')}`;
    });

    return new Chart(ctx, {
        type: 'line',
        data: {
            labels: timeLabels,
            datasets: labels.map(label => ({
                label: label,
                borderColor: `rgb(${Math.floor(Math.random() * 255)}, ${Math.floor(Math.random() * 255)}, ${Math.floor(Math.random() * 255)})`,
                tension: 0.1,
                fill: false,
                data: []
            }))
            .concat(includeIndLine ? [{
                label: `ind_${canvasId.replace('Chart', '')}`,  
                borderColor: 'rgba(255, 0, 0, 0.8)',  
                borderWidth: 2,
                tension: 0.1,
                fill: false,
                data: []  
            }] : [])
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                title: {
                    display: true,
                    text: title
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            // ... (tooltip callback remains the same)
                        }
                    }
                }
            },
            scales: {
                x: {
                    title: {
                        display: true,
                        text: 'Time (m:ss)'
                    }
                },
                y: {
                    beginAtZero: true
                }
            }
        }
    });
}

function initStandardizedChart() {
    charts.standardizedChart = createStandardizedChart();
}

function updateStandardizedChart(standardizedValues) {
    const standardizedChart = charts.standardizedChart;

    standardizedChart.data.datasets.forEach(dataset => {
        if (standardizedValues[dataset.label] !== null) {
            dataset.data.push(standardizedValues[dataset.label]);

            // Limitar a los últimos 10 puntos
            if (dataset.data.length > 10) {
                dataset.data.shift();
            }
        }
    });

    standardizedChart.update();  // Actualizar la gráfica estandarizada
}

function initCharts() {
    charts.magnetometro = createChart('magnetometroChart', 'Magnetómetro', ['mag_x', 'mag_y', 'mag_z']);
    charts.giroscopio = createChart('giroscopioChart', 'Giroscopio', ['giro_x', 'giro_y', 'giro_z']);
    charts.acelerometro = createChart('acelerometroChart', 'Acelerómetro', ['acel_x', 'acel_y', 'acel_z']);
    charts.gps = createChart('gpsChart', 'GPS', ['gps_lat', 'gps_lon']);
    charts.barometro = createChart('barometroChart', 'Barómetro', ['barometro']);
    charts.ruido = createChart('ruidoChart', 'Ruido', ['ruido']);
    charts.vibracion = createChart('vibracionChart', 'Vibración', ['vibracion']);
}

async function fetchData() {
    try {
        const response = await fetch('http://localhost:8000/api/v1/api/sensor-data/');
        const data = await response.json();
        
        const currentGroup = data.find(group => group.averages.id === 'latest_50');  // Cambiado para que siempre obtenga los últimos datos
        if (currentGroup) {
            updateCharts(currentGroup.averages);
            statistics = currentGroup.statistics;
        }
    } catch (error) {
        console.error('Error fetching data:', error);
    }
}

// Función para calcular la media
function calcularMedia(valores) {
    const sum = valores.reduce((a, b) => a + b, 0);
    return sum / valores.length;
}

// Función para calcular la desviación estándar
function calcularDesviacionEstandar(valores, media) {
    const sum = valores.reduce((a, b) => a + Math.pow(b - media, 2), 0);
    return Math.sqrt(sum / valores.length);
}

// Función para estandarizar un valor usando la fórmula z = (X - mean) / std
function estandarizar(valor, valoresPrevios) {
    if (valoresPrevios.length === 0) return 0; // Evitar división por 0 si no hay valores previos
    const media = calcularMedia(valoresPrevios);
    const desviacionEstandar = calcularDesviacionEstandar(valoresPrevios, media);

    const epsilon = 1e-6; // Un valor muy pequeño para evitar que la desviación estándar sea 0
    if (desviacionEstandar === 0) return 0; // Si la desviación es exactamente 0
    return (valor - media) / (desviacionEstandar + epsilon); // Evitar que divida por 0
}

// Valores previos para calcular la estandarización
let valoresPrevios = {
    ind_magnetometro: [],
    ind_giroscopio: [],
    ind_acelerometro: [],
    ind_gps: [],
    barometro: [],
    ruido: [],
    vibracion: []
};

function updateCharts(averages) {
    let standardizedValues = {
        ind_magnetometro: null,
        ind_giroscopio: null,
        ind_acelerometro: null,
        ind_gps: null,
        barometro: null,
        ruido: null,
        vibracion: null
    };

    Object.keys(charts).forEach(key => {
        const chart = charts[key];

        let relatedValues = [];
        let divisor = 3;

        chart.data.datasets.forEach(dataset => {
            const excludedCharts = ['ruido', 'barometro', 'vibracion'];

            if (dataset.label.startsWith('ind_')) {
                if (excludedCharts.some(ex => key.includes(ex))) {
                    return;  // Omitir el cálculo de `ind_` para las gráficas excluidas
                }

                if (key.includes('gps')) {
                    divisor = 2;
                }

                if (relatedValues.length === divisor) {
                    const ind_value = relatedValues.reduce((sum, val) => sum + val, 0) / divisor;
                    dataset.data.push(ind_value);
                }
            } else {
                if (averages[dataset.label] !== undefined) {
                    dataset.data.push(averages[dataset.label]);
                }

                if (dataset.label.includes('mag_')) {
                    relatedValues.push(averages[dataset.label]);
                    standardizedValues.ind_magnetometro = (averages.mag_x + averages.mag_y + averages.mag_z) / 3;
                }
                if (dataset.label.includes('giro_')) {
                    relatedValues.push(averages[dataset.label]);
                    standardizedValues.ind_giroscopio = (averages.giro_x + averages.giro_y + averages.giro_z) / 3;
                }
                if (dataset.label.includes('acel_')) {
                    relatedValues.push(averages[dataset.label]);
                    standardizedValues.ind_acelerometro = (averages.acel_x + averages.acel_y + averages.acel_z) / 3;
                }
                if (dataset.label.includes('gps_')) {
                    relatedValues.push(averages[dataset.label]);
                    standardizedValues.ind_gps = (averages.gps_lat + averages.gps_lon) / 2;
                }

                // Agregamos los valores directos de barómetro, ruido y vibración
                if (key === 'barometro') {
                    standardizedValues.barometro = averages[dataset.label];
                }
                if (key === 'ruido') {
                    standardizedValues.ruido = averages[dataset.label];
                }
                if (key === 'vibracion') {
                    standardizedValues.vibracion = averages[dataset.label];
                }
            }

            if (dataset.data.length > 10) {
                dataset.data.shift();
            }
        });

        chart.update();  // Actualizar la gráfica original
    });

    // Aplicamos la estandarización usando la fórmula z = (X - mean) / std
    Object.keys(standardizedValues).forEach(key => {
        if (standardizedValues[key] !== null) {
            const valorEstandarizado = estandarizar(standardizedValues[key], valoresPrevios[key]);
            valoresPrevios[key].push(standardizedValues[key]); // Guardamos el valor actual

            // Limitar los valores previos a los últimos 10
            if (valoresPrevios[key].length > 10) {
                valoresPrevios[key].shift();
            }

            standardizedValues[key] = valorEstandarizado; // Guardamos el valor estandarizado
        }
    });

    // Actualizamos la gráfica estandarizada con los valores estandarizados
    updateStandardizedChart(standardizedValues);
}

function createStandardizedChart() {
    const ctx = document.getElementById('standardizedChart').getContext('2d');

    const timeLabels = Array.from({length: 10}, (_, i) => {
        const seconds = i * 10;
        return `${Math.floor(seconds / 60)}:${(seconds % 60).toString().padStart(2, '0')}`;
    });

    return new Chart(ctx, {
        type: 'line',
        data: {
            labels: timeLabels,
            datasets: [
                {
                    label: 'ind_magnetometro',
                    borderColor: 'rgba(255, 0, 0, 0.8)',
                    borderWidth: 2,
                    tension: 0.1,
                    fill: false,
                    data: []
                },
                {
                    label: 'ind_giroscopio',
                    borderColor: 'rgba(0, 255, 0, 0.8)',
                    borderWidth: 2,
                    tension: 0.1,
                    fill: false,
                    data: []
                },
                {
                    label: 'ind_acelerometro',
                    borderColor: 'rgba(0, 0, 255, 0.8)',
                    borderWidth: 2,
                    tension: 0.1,
                    fill: false,
                    data: []
                },
                {
                    label: 'ind_gps',
                    borderColor: 'rgba(255, 255, 0, 0.8)',
                    borderWidth: 2,
                    tension: 0.1,
                    fill: false,
                    data: []
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                title: {
                    display: true,
                    text: 'Gráfica Estandarizada'
                }
            },
            scales: {
                x: {
                    title: {
                        display: true,
                        text: 'Time (m:ss)'
                    }
                },
                y: {
                    beginAtZero: true
                }
            }
        }
    });
}

async function fetchHistoricalData() {
    try {
        const response = await fetch('http://localhost:8000/api/v1/api/sensor-data/');
        const data = await response.json();
        return data;
    } catch (error) {
        console.error('Error fetching historical data:', error);
        return null;
    }
}

function createHistoricalChart(data) {
    const ctx = document.getElementById('historicalChart').getContext('2d');
    
    const datasets = Object.keys(data[0]).filter(key => key !== 'timestamp').map(key => ({
        label: key,
        data: data.map(entry => entry[key]),
        borderColor: `rgb(${Math.floor(Math.random() * 255)}, ${Math.floor(Math.random() * 255)}, ${Math.floor(Math.random() * 255)})`,
        tension: 0.1,
        fill: false
    }));

    return new Chart(ctx, {
        type: 'line',
        data: {
            labels: data.map(entry => new Date(entry.timestamp).toLocaleString()),
            datasets: datasets
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                title: {
                    display: true,
                    text: 'Datos Históricos'
                },
                tooltip: {
                    mode: 'index',
                    intersect: false
                }
            },
            scales: {
                x: {
                    type: 'time',
                    time: {
                        unit: 'day'
                    }
                },
                y: {
                    beginAtZero: true
                }
            }
        }
    });
}

document.addEventListener('DOMContentLoaded', async function() {
    initCharts();
    initStandardizedChart();
    fetchData();
    setInterval(fetchData, 10000);  // Polling cada 10 segundos

    // Agregar la nueva gráfica histórica
    const historicalData = await fetchHistoricalData();
    if (historicalData) {
        createHistoricalChart(historicalData);
    }
});