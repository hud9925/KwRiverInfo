
SQLALCHEMY_URI = (
   "database_url";
)

"""
Non‑secret defaults
"""
import os
from dotenv import load_dotenv

load_dotenv()                      # reads .env locally 

KIWIS_BASE_URL = "https://waterdata.grandriver.ca/KiWIS/KiWIS"
TIMEZONE       = "America/Toronto"

SQLALCHEMY_DATABASE_URI = os.environ["SQLALCHEMY_URI"]   # required
SQLALCHEMY_TRACK_MODIFICATIONS = False

