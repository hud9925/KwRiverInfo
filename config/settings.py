import os

KIWIS_BASE_URL = "https://waterdata.grandriver.ca/KiWIS/KiWIS"
TIMEZONE = "America/Toronto"


SQLALCHEMY_URI = (
    
    # "postgresql://postgres:IXOCiBsjvkrFO2lc@db.isymmqaheoprqdsjgyvg.supabase.co:5432/postgres"
    "postgresql://postgres.isymmqaheoprqdsjgyvg:IXOCiBsjvkrFO2lc@aws-0-us-east-2.pooler.supabase.com:6543/postgres"
    
    #  "postgresql+psycopg2://{user}:{password}@{host}:{port}/{database}"
    # .format(**DB_CONFIG)
)

SQLALCHEMY_DATABASE_URI = os.getenv(
    "SQLALCHEMY_URI",
    "postgresql://postgres.isymmqaheoprqdsjgyvg:IXOCiBsjvkrFO2lc@aws-0-us-east-2.pooler.supabase.com:6543/postgres"
)
SQLALCHEMY_TRACK_MODIFICATIONS = False

