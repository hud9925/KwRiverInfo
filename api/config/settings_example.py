import os
from dotenv import load_dotenv

load_dotenv()  

KIWIS_BASE_URL = "https://waterdata.grandriver.ca/KiWIS/KiWIS"
TIMEZONE       = "America/Toronto"

# this must match your .env key
SQLALCHEMY_DATABASE_URI = os.environ["SQLALCHEMY_URI"]
SQLALCHEMY_TRACK_MODIFICATIONS = False

SUPABASE_URL      = os.getenv("SUPABASE_URL")
SUPABASE_ANON_KEY = os.getenv("SUPABASE_ANON_KEY")
