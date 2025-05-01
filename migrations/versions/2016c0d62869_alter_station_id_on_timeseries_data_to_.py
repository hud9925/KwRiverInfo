"""Alter station_id on timeseries_data to Integer FK to stations.id

Revision ID: 2016c0d62869
Revises: 43bc0c161286
Create Date: 2025-05-02 00:28:11.205690

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision = '2016c0d62869'
down_revision = '43bc0c161286'
branch_labels = None
depends_on = None


def upgrade():
    op.drop_constraint('timeseries_data_station_id_fkey', 'timeseries_data', type_='foreignkey')
    op.alter_column(
        'timeseries_data', 'station_id',
        existing_type=sa.String(length=64),
        type_=sa.Integer(),
        postgresql_using='station_id::integer',
        existing_nullable=False
    )
    # 3) create the new FK to stations.id
    op.create_foreign_key(
        'fk_timeseries_data_station_id_stations',
        'timeseries_data', 'stations',
        ['station_id'], ['id']
    )

    # ### end Alembic commands ###


def downgrade():
    
    op.drop_constraint('fk_timeseries_data_station_id_stations', 'timeseries_data', type_='foreignkey')
    
    op.alter_column(
        'timeseries_data', 'station_id',
        existing_type=sa.Integer(),
        type_=sa.String(length=64),
        postgresql_using='station_id::text',
        existing_nullable=False
    )
    
    op.create_foreign_key(
        'timeseries_data_station_id_fkey',
        'timeseries_data', 'stations',
        ['station_id'], ['station_id']
    )
    # ### end Alembic commands ###
