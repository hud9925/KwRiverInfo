import os
from dotenv import load_dotenv

load_dotenv()  # read from .env locally

KIWIS_BASE_URL = "https://waterdata.grandriver.ca/KiWIS/KiWIS"
TIMEZONE       = "America/Toronto"

# this must match your .env key
SQLALCHEMY_DATABASE_URI = os.environ["SQLALCHEMY_URI"]
SQLALCHEMY_TRACK_MODIFICATIONS = False
