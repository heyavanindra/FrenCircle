# Backend FastAPI (minimal)

This folder contains a minimal FastAPI app with a `/health` endpoint and a static `index.html` that calls the health API.

Build and run with Docker (PowerShell):

```powershell
# From this folder (backend_fastapi)
docker build -t backend-fastapi .
docker run --rm -p 8000:8000 backend-fastapi
```

Visit http://localhost:8000 to see the `index.html`. The container exposes port `8000` and the Dockerfile includes a healthcheck.
