# this is the entry point of the whole application

from app import create_app

# create_app is a function which is in the __init__.py file in the app folder

app = create_app()

if __name__ == "__main__":
    app.run(debug=True)  # when developing debug=True, then change to debug=False
