FROM nginx

# Copia el archivo de configuración personalizado a la ubicación de configuración de Nginx
COPY nginx.conf /etc/nginx/nginx.conf
