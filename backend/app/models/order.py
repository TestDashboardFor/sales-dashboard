from datetime import date
from decimal import Decimal

from sqlalchemy import Date, Index, Numeric, String
from sqlalchemy.orm import Mapped, mapped_column

from app.db import Base


class Order(Base):
    __tablename__ = "orders"
    __table_args__ = (
        Index("ix_orders_order_date", "order_date"),
        Index("ix_orders_category", "category"),
        Index("ix_orders_region", "region"),
    )

    id: Mapped[int] = mapped_column(primary_key=True)
    order_id: Mapped[str] = mapped_column(String(20))
    order_date: Mapped[date] = mapped_column(Date)
    ship_date: Mapped[date] = mapped_column(Date)
    ship_mode: Mapped[str] = mapped_column(String(30))
    customer_name: Mapped[str] = mapped_column(String(100))
    segment: Mapped[str] = mapped_column(String(30))
    city: Mapped[str] = mapped_column(String(100))
    state: Mapped[str] = mapped_column(String(100))
    region: Mapped[str] = mapped_column(String(30))
    category: Mapped[str] = mapped_column(String(50))
    sub_category: Mapped[str] = mapped_column(String(50))
    product_name: Mapped[str] = mapped_column(String(255))
    sales: Mapped[Decimal] = mapped_column(Numeric(12, 2))
    quantity: Mapped[int]
    discount: Mapped[Decimal] = mapped_column(Numeric(4, 2))
    profit: Mapped[Decimal] = mapped_column(Numeric(12, 2))
