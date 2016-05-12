map $http_upgrade $connection_upgrade {
  default upgrade;
  ''      close;
}

server {
    listen   80;
    server_name {{ domain_name }};
    return 301 http://www.{{ domain_name }}$request_uri;
    }

upstream tv_{{ domain_name }} {
    server 127.0.0.1:8000;
    keepalive 64;
}

server {
    listen 80 ;
    server_name www.{{ domain_name }};
    access_log {{ webapps_dir}}/{{ app_name }}/log/{{ domain_name }}.access.log;
    error_log {{ webapps_dir}}/{{ app_name }}/log/{{ domain_name }}.error.log info;
    large_client_header_buffers 4 64k;

    location / {
          proxy_pass http://tv_{{ domain_name }}/;
          proxy_set_header X-Real-IP $remote_addr;
          proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
          proxy_set_header Host $host;
#         proxy_set_header Host $http_host;
          proxy_set_header X-NginX-Proxy true;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection $connection_upgrade;

#         proxy_redirect off;
    }
  location /socket.io/ {
        proxy_pass http://127.0.0.1:8000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection $connection_upgrade;
  }
}
