FROM node:20-alpine
WORKDIR /app
COPY dist/ ./
ENV PORT=8080
ENV NODE_ENV=production
EXPOSE 8080
CMD ["node", "server.cjs"]
