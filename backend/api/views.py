from rest_framework import viewsets
from rest_framework.response import Response
from .models import SensorData
from .serializers import SensorDataSerializer

class SensorDataViewSet(viewsets.ModelViewSet):
    queryset = SensorData.objects.all()
    serializer_class = SensorDataSerializer

    def list(self, request, *args, **kwargs):
        # Obtener todos los datos
        data = SensorData.objects.all().values(
            'id', 'mag_x', 'mag_y', 'mag_z', 'barometro', 'ruido',
            'giro_x', 'giro_y', 'giro_z', 'acel_x', 'acel_y', 'acel_z',
            'vibracion', 'gps_lat', 'gps_lon'
        )

        # Convertir a una lista
        data_list = list(data)
        window_size = 50  # TamaÃ±o de la ventana para calcular la media
        grouped_data = []
        current_id = 1  # Inicializar el contador de IDs

        # Agrupar los datos y calcular medias
        for i in range(len(data_list) - window_size + 1):
            window_data = data_list[i:i + window_size]
            avg_data = {
                'id': current_id,  # Asignar un ID incremental
                'mag_x': sum(item['mag_x'] for item in window_data) / window_size,
                'mag_y': sum(item['mag_y'] for item in window_data) / window_size,
                'mag_z': sum(item['mag_z'] for item in window_data) / window_size,
                'barometro': sum(item['barometro'] for item in window_data) / window_size,
                'ruido': sum(item['ruido'] for item in window_data) / window_size,
                'giro_x': sum(item['giro_x'] for item in window_data) / window_size,
                'giro_y': sum(item['giro_y'] for item in window_data) / window_size,
                'giro_z': sum(item['giro_z'] for item in window_data) / window_size,
                'acel_x': sum(item['acel_x'] for item in window_data) / window_size,
                'acel_y': sum(item['acel_y'] for item in window_data) / window_size,
                'acel_z': sum(item['acel_z'] for item in window_data) / window_size,
                'vibracion': sum(item['vibracion'] for item in window_data) / window_size,
                'gps_lat': sum(item['gps_lat'] for item in window_data) / window_size,
                'gps_lon': sum(item['gps_lon'] for item in window_data) / window_size,
            }
            grouped_data.append(avg_data)
            current_id += 1  # Incrementar el ID

        return Response(grouped_data)