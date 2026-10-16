from fastapi import FastAPI
from config import DATABASE_URL

app=FastAPI(
    swagger_ui_parameters={"tryItOutEnabled": True}
)


@app.get('/health')
async def health_check():
    return {
        "status":"ok"
    }