"""create users and orders

Revision ID: 0001
Revises: 
"""
from alembic import op
import sqlalchemy as sa


revision = '0001'
down_revision = None
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table('orders',
    sa.Column('id', sa.Integer(), nullable=False),
    sa.Column('order_id', sa.String(length=20), nullable=False),
    sa.Column('order_date', sa.Date(), nullable=False),
    sa.Column('ship_date', sa.Date(), nullable=False),
    sa.Column('ship_mode', sa.String(length=30), nullable=False),
    sa.Column('customer_name', sa.String(length=100), nullable=False),
    sa.Column('segment', sa.String(length=30), nullable=False),
    sa.Column('city', sa.String(length=100), nullable=False),
    sa.Column('state', sa.String(length=100), nullable=False),
    sa.Column('region', sa.String(length=30), nullable=False),
    sa.Column('category', sa.String(length=50), nullable=False),
    sa.Column('sub_category', sa.String(length=50), nullable=False),
    sa.Column('product_name', sa.String(length=255), nullable=False),
    sa.Column('sales', sa.Numeric(precision=12, scale=2), nullable=False),
    sa.Column('quantity', sa.Integer(), nullable=False),
    sa.Column('discount', sa.Numeric(precision=4, scale=2), nullable=False),
    sa.Column('profit', sa.Numeric(precision=12, scale=2), nullable=False),
    sa.PrimaryKeyConstraint('id')
    )
    op.create_index('ix_orders_category', 'orders', ['category'], unique=False)
    op.create_index('ix_orders_order_date', 'orders', ['order_date'], unique=False)
    op.create_index('ix_orders_region', 'orders', ['region'], unique=False)
    op.create_table('users',
    sa.Column('id', sa.Integer(), nullable=False),
    sa.Column('username', sa.String(length=50), nullable=False),
    sa.Column('password_hash', sa.String(length=255), nullable=False),
    sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
    sa.PrimaryKeyConstraint('id'),
    sa.UniqueConstraint('username')
    )


def downgrade() -> None:
    op.drop_table('users')
    op.drop_index('ix_orders_region', table_name='orders')
    op.drop_index('ix_orders_order_date', table_name='orders')
    op.drop_index('ix_orders_category', table_name='orders')
    op.drop_table('orders')
