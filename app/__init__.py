# this sets up the Flask app and registers blueprints
# blueprints are used to organize the app routes


from flask import Flask
from flask_session import Session
from app.config import Config


# this function is responsible for setting up and returning a Flask application instance
def create_app():
    app = Flask(__name__)
    app.config.from_object(Config)

    Session(app) 
    # session is used in this app to store data across requests for the same client

    from app.routes import bp as routes_bp 

    app.register_blueprint(routes_bp)

    return app
