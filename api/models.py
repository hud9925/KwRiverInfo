# api/models.py
from .db import db

class Station(db.Model):
    __tablename__ = "stations"
    id         = db.Column(db.Integer,   primary_key=True)
    station_id = db.Column(db.String(64), unique=True, nullable=False)
    name       = db.Column(db.String,     nullable=True)
    latitude   = db.Column(db.Float,      nullable=True)
    longitude  = db.Column(db.Float,      nullable=True)
    station_type = db.Column(db.String(20))
    timeseries_meta = db.relationship(
        "TimeSeriesMetadata",
        back_populates="station",
        cascade="all, delete-orphan",
    )
    data = db.relationship(
        "TimeSeriesData",
        back_populates="station",
        cascade="all, delete-orphan",
    )


class TimeSeriesMetadata(db.Model):
    __tablename__ = "timeseries_metadata"
    ts_id              = db.Column(db.BigInteger, primary_key=True)
    station_id         = db.Column(db.Integer,    db.ForeignKey("stations.id"), nullable=False, index=True)
    ts_path            = db.Column(db.String,     nullable=True)
    ts_name            = db.Column(db.String,     nullable=True)
    ts_shortname       = db.Column(db.String,     nullable=True)
    parametertype_id   = db.Column(db.String,     nullable=True)
    parametertype_name = db.Column(db.String,     nullable=True)

    station    = db.relationship("Station", back_populates="timeseries_meta")
    data       = db.relationship(
        "TimeSeriesData", back_populates="ts_metadata", cascade="all, delete-orphan"
    )


class TimeSeriesData(db.Model):
    __tablename__ = "time_series_data"
    id                 = db.Column(db.Integer, primary_key=True)
    timestamp          = db.Column(db.DateTime(timezone=True), nullable=False, index=True)
    value              = db.Column(db.Float,                        nullable=False)
    ts_id              = db.Column(db.BigInteger, db.ForeignKey("timeseries_metadata.ts_id"), nullable=False, index=True)
    station_id         = db.Column(db.Integer, db.ForeignKey("stations.id"),           nullable=False, index=True)
    parametertype_name = db.Column(db.String,     nullable=True)
    unit               = db.Column(db.String,     nullable=True)
    parameter_fullname = db.Column(db.String,     nullable=True)

    station     = db.relationship("Station",          back_populates="data")
    ts_metadata = db.relationship("TimeSeriesMetadata", back_populates="data")
