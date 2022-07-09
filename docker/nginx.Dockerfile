FROM nginx

COPY nginx.conf /etc/nginx/nginx.conf
COPY ssl/ /etc/ssl/
