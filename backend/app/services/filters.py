from dataclasses import dataclass
from datetime import date

from sqlalchemy import Select

from app.models import Order


@dataclass
class OrderFilters:
    date_from: date | None = None
    date_to: date | None = None
    region: str | None = None
    category: str | None = None
    segment: str | None = None

    def apply(self, stmt: Select) -> Select:
        if self.date_from:
            stmt = stmt.where(Order.order_date >= self.date_from)
        if self.date_to:
            stmt = stmt.where(Order.order_date <= self.date_to)
        if self.region:
            stmt = stmt.where(Order.region == self.region)
        if self.category:
            stmt = stmt.where(Order.category == self.category)
        if self.segment:
            stmt = stmt.where(Order.segment == self.segment)
        return stmt


def get_filters(
    date_from: date | None = None,
    date_to: date | None = None,
    region: str | None = None,
    category: str | None = None,
    segment: str | None = None,
) -> OrderFilters:
    return OrderFilters(date_from, date_to, region, category, segment)
