from datetime import datetime, timezone

from config.settings_example import SQLALCHEMY_DATABASE_URI as SQLALCHEMY_URI

from sqlalchemy import (
    Column, Integer, Float, DateTime, String, MetaData, create_engine, ForeignKey,
)
from sqlalchemy.orm import declarative_base, Session, relationship

engine = create_engine(SQLALCHEMY_URI, pool_pre_ping=True)
Base   = declarative_base(metadata=MetaData())

# ─── Models ───────────────────────────────────────────────────────────
class Station(Base):
    __tablename__ = 'stations'

    id = Column(Integer, primary_key=True)
    station_id = Column(String, unique=True, nullable=False)
    name = Column(String, nullable=True)
    latitude = Column(Float, nullable=True)
    longitude = Column(Float, nullable=True)

    timeseries_meta = relationship(
        'TimeseriesMetadata', back_populates='station', cascade='all, delete-orphan'
    )
    data = relationship(
        'TimeseriesData', back_populates='station', cascade='all, delete-orphan'
    )

class TimeseriesMetadata(Base):
    __tablename__ = 'timeseries_metadata'

    ts_id = Column(Integer, primary_key=True)
    station_id = Column(Integer, ForeignKey('stations.id'), nullable=False)
    ts_path = Column(String, nullable=True)
    ts_name = Column(String, nullable=True)
    ts_shortname = Column(String, nullable=True)
    parametertype_id = Column(String, nullable=True)
    parametertype_name = Column(String, nullable=True)

    station = relationship('Station', back_populates='timeseries_meta')
    data = relationship(
        'TimeseriesData', back_populates='ts_metadata', cascade='all, delete-orphan'
    )

class TimeseriesData(Base):
    __tablename__ = 'timeseries_data'

    id = Column(Integer, primary_key=True, autoincrement=True)
    timestamp = Column(DateTime(timezone=True), nullable=False, index=True)
    value = Column(Float, nullable=False)
    ts_id = Column(Integer, ForeignKey('timeseries_metadata.ts_id'), nullable=False)
    station_id = Column(Integer, ForeignKey('stations.id'), nullable=False)
    parametertype_name = Column(String, nullable=True)
    unit = Column(String, nullable=True)
    parameter_fullname = Column(String, nullable=True)

    station = relationship('Station', back_populates='data')
    ts_metadata = relationship('TimeseriesMetadata', back_populates='data')

# create tables
Base.metadata.create_all(engine)

# session factory

def get_session() -> Session:
    return Session(engine, autoflush=False, expire_on_commit=False)
