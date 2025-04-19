# this file includes class that stores configurations like the secret key

import os


class Config:
    SECRET_KEY = os.urandom(24)
    # the secret key is generated randomly, it must be created if I want to used objects like session
    SESSION_TYPE = "filesystem"
