# Usamos una imagen ligera de Python 3.13
FROM python:3.13-slim

WORKDIR /app

# Copiamos las dependencias y las instalamos
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copiamos nuestro código
COPY src ./src

# Exponemos el puerto gRPC
EXPOSE 50051

# Arrancamos el servidor gRPC
CMD ["python", "-m", "src.grpc_server"]