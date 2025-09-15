# Use official Node image for build
FROM node:20-alpine AS build
WORKDIR /app
COPY package.json tsconfig.json ./
COPY public ./public
COPY src ./src
RUN npm install -g react-scripts && npm install
RUN npm run build

# Use nginx to serve build
FROM nginx:alpine
COPY --from=build /app/build /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]