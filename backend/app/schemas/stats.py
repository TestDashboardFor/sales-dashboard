from datetime import date

from pydantic import BaseModel


class Summary(BaseModel):
    total_sales: float
    total_profit: float
    total_quantity: int
    orders: int
    profit_margin: float


class TimeseriesPoint(BaseModel):
    period: date
    sales: float
    profit: float
    orders: int


class BreakdownItem(BaseModel):
    label: str
    sales: float
    profit: float
    orders: int


class FilterOptions(BaseModel):
    regions: list[str]
    categories: list[str]
    segments: list[str]
    date_min: date | None
    date_max: date | None
