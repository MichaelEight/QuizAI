from flask import Flask
from Backend.api.api_endpoints import register_endpoints

app = Flask(__name__)
register_endpoints(app)
