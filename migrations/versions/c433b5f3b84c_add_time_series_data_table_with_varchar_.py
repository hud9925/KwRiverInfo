# migrations/versions/c433b5f3b84c_add_time_series_data_table_with_varchar_.py

from alembic import op
import sqlalchemy as sa
from sqlalchemy import inspect
from sqlalchemy.dialects import mysql

# revision identifiers, used by Alembic.
revision = 'c433b5f3b84c'
down_revision = 'd16cbf37ad54'
branch_labels = None
depends_on = None

def upgrade():
    conn = op.get_bind()
    inspector = inspect(conn)
    existing = {idx['name'] for idx in inspector.get_indexes('time_series_data')}

    with op.batch_alter_table('time_series_data') as batch_op:
        batch_op.alter_column(
            'station_id',
            existing_type=mysql.TEXT(),
            type_=mysql.VARCHAR(length=64),
            existing_nullable=False,
        )

        # only create these if they don’t already exist
        if 'ix_time_series_data_station_id' not in existing:
            batch_op.create_index('ix_time_series_data_station_id', ['station_id'])
        if 'ix_time_series_data_timestamp' not in existing:
            batch_op.create_index('ix_time_series_data_timestamp', ['timestamp'])
        if 'ix_time_series_data_ts_id' not in existing:
            batch_op.create_index('ix_time_series_data_ts_id', ['ts_id'])


def downgrade():
    conn = op.get_bind()
    inspector = inspect(conn)
    existing = {idx['name'] for idx in inspector.get_indexes('time_series_data')}

    with op.batch_alter_table('time_series_data') as batch_op:
        if 'ix_time_series_data_ts_id' in existing:
            batch_op.drop_index('ix_time_series_data_ts_id')
        if 'ix_time_series_data_timestamp' in existing:
            batch_op.drop_index('ix_time_series_data_timestamp')
        if 'ix_time_series_data_station_id' in existing:
            batch_op.drop_index('ix_time_series_data_station_id')

        batch_op.alter_column(
            'station_id',
            existing_type=mysql.VARCHAR(length=64),
            type_=mysql.TEXT(),
            existing_nullable=False,
        )
