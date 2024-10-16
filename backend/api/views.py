from rest_framework import viewsets
from rest_framework.response import Response
from .models import SensorData
from .serializers import SensorDataSerializer
from statistics import mean, median, stdev

class SensorDataViewSet(viewsets.ModelViewSet):
    queryset = SensorData.objects.all()
    serializer_class = SensorDataSerializer

    def calculate_statistics(self, values):
        if not values:
            return None
        
        sorted_values = sorted(values)
        n = len(sorted_values)
        
        def percentile(p):
            if n == 0:
                return None
            if p == 0:
                return sorted_values[0]
            if p == 100:
                return sorted_values[-1]
            i = int(((n - 1) * p) / 100)
            return sorted_values[i]
        
        try:
            return {
                'mean': mean(values),
                'std_dev': stdev(values) if n > 1 else 0,
                'q1': percentile(25),
                'median': median(values),
                'q3': percentile(75),
                'p90': percentile(90),
                'p95': percentile(95)
            }
        except Exception as e:
            print(f"Error calculating statistics: {e}")
            return None

    def list(self, request, *args, **kwargs):
        # Obtener todos los datos
        data = list(SensorData.objects.all().values(
            'id', 'mag_x', 'mag_y', 'mag_z', 'barometro', 'ruido',
            'giro_x', 'giro_y', 'giro_z', 'acel_x', 'acel_y', 'acel_z',
            'vibracion', 'gps_lat', 'gps_lon'
        ))

        window_size = 50
        grouped_data = []
        
        sensor_fields = [
            'mag_x', 'mag_y', 'mag_z', 'barometro', 'ruido',
            'giro_x', 'giro_y', 'giro_z', 'acel_x', 'acel_y', 'acel_z',
            'vibracion', 'gps_lat', 'gps_lon'
        ]

        # Usar ventana deslizante para procesar los datos
        for start_idx in range(len(data) - window_size + 1):
            window_data = data[start_idx:start_idx + window_size]
            
            avg_data = {'id': start_idx + 1}  # ID basado en el índice inicial
            stats_data = {'id': start_idx + 1}

            for field in sensor_fields:
                # Extraer valores para este campo en la ventana actual
                field_values = [item[field] for item in window_data]
                
                # Calcular media
                avg_data[field] = sum(field_values) / window_size
                
                # Calcular estadísticas
                stats_data[f"{field}_stats"] = self.calculate_statistics(field_values)

            grouped_data.append({
                'averages': avg_data,
                'statistics': stats_data
            })

        return Response(grouped_data)