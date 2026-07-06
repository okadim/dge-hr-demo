# Cloud Run image: build the frontend, then serve API + static UI from FastAPI.
FROM node:22-alpine AS ui
WORKDIR /ui
COPY frontend/package.json frontend/package-lock.json* ./
RUN npm install --no-audit --no-fund
COPY frontend/ .
RUN npm run build

FROM python:3.12-slim
WORKDIR /srv
COPY backend/requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt
COPY backend/main.py backend/state.py backend/agents.py backend/models.py ./
COPY --from=ui /ui/dist ./static
COPY demo-assets/emirates-id-mariam-specimen.png ./static/
EXPOSE 8080
CMD exec uvicorn main:app --host 0.0.0.0 --port ${PORT:-8080}
