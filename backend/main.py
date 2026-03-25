from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from database import engine, Base
from routes import auth_routes, question_routes, validation_routes, dashboard_routes

# Create all tables
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="Integral Calculus Platform",
    description="A code-runner style platform for teaching and evaluating step-by-step integral calculus solutions",
    version="1.0.0"
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:3000", "http://127.0.0.1:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(auth_routes.router)
app.include_router(question_routes.router)
app.include_router(validation_routes.router)
app.include_router(dashboard_routes.router)


@app.get("/")
def root():
    return {
        "message": "Integral Calculus Platform API",
        "docs": "/docs",
        "version": "1.0.0"
    }


@app.get("/api/health")
def health_check():
    return {"status": "healthy"}
