from pathlib import Path
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from database import engine, Base, ensure_schema
from routes import auth_routes, question_routes, validation_routes, dashboard_routes

# Create all tables
Base.metadata.create_all(bind=engine)
ensure_schema()

app = FastAPI(
    title="Integral Calculus Platform",
    description="A code-runner style platform for teaching and evaluating step-by-step integral calculus solutions",
    version="1.0.0"
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5175",
        "http://127.0.0.1:5175",
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:3000",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(auth_routes.router)
app.include_router(question_routes.router)
app.include_router(validation_routes.router)
app.include_router(dashboard_routes.router)


@app.get("/api/health")
def health_check():
    return {"status": "healthy"}


# Serve the built React frontend — must be mounted last so API routes take priority
_static_dir = Path(__file__).parent.parent / "frontend" / "dist"
if _static_dir.exists():
    app.mount("/", StaticFiles(directory=str(_static_dir), html=True), name="static")
