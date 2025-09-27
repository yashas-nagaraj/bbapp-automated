FROM nginx:alpine

# Use our site config as the default server (keeps base nginx.conf which includes mime.types)
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copy static site (index.html, app.js, styles.css, assets/)
COPY . /usr/share/nginx/html

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
