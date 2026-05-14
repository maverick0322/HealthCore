# Usamos una imagen ligera y oficial de Python 3.13
FROM python:3.13-slim

# 1. SEGURIDAD: Creamos un usuario sin privilegios de root
RUN useradd -m cataloguser

# 2. ENTORNO: Establecemos el directorio de trabajo
WORKDIR /app

# 3. CACHÉ: Copiamos las dependencias primero e instalamos
# Esto evita reinstalar paquetes si solo modificas el código fuente
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# 4. PRODUCCIÓN: Copiamos SOLO la carpeta src (dejamos tests y configuraciones de desarrollo fuera)
COPY src ./src

# 5. PERMISOS: Cedemos el control de los archivos al nuevo usuario y cambiamos a él
RUN chown -R cataloguser:cataloguser /app
USER cataloguser

# 6. RED: Exponemos el puerto de gRPC (50051)
EXPOSE 50051

# 7. ARRANQUE: Iniciamos el servidor gRPC
CMD ["python", "-m", "src.grpc_server"]