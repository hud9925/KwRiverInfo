from datetime import datetime, timezone

from config.settings import SQLALCHEMY_URI
print("SQLALCHEMY_URI =", SQLALCHEMY_URI)

from sqlalchemy import (
    Column, Integer, Float, DateTime, String, MetaData, create_engine
)
from sqlalchemy.orm import declarative_base, Session

from config.settings import SQLALCHEMY_URI

engine = create_engine(SQLALCHEMY_URI, pool_pre_ping=True)
Base   = declarative_base(metadata=MetaData())

class Observation(Base):
    __tablename__ = "observations"

    id        = Column(Integer, primary_key=True)
    ts_id     = Column(Integer, index=True, nullable=False)
    station_id= Column(String(16), index=True, nullable=False)

    timestamp = Column(DateTime(timezone=True), index=True, nullable=False)
    value     = Column(Float, nullable=False)

    parameter_type_name = Column(String(4))   # HG / QR / …
    parameter_fullname  = Column(String(64))
    unit       = Column(String(12))

    created_at = Column(DateTime(timezone=True),
                        default=lambda: datetime.now(timezone.utc),
                        nullable=False)

# run once at import time (fine for simple project – otherwise use Alembic)
Base.metadata.create_all(engine)

def get_session() -> Session:
    return Session(engine, autoflush=False, expire_on_commit=False)
