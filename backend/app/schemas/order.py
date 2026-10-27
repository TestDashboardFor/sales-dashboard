from datetime import date
from decimal import Decimal
from typing import Annotated

from pydantic import BaseModel, ConfigDict, Field, PlainSerializer, model_validator

Money = Annotated[Decimal, PlainSerializer(float, return_type=float, when_used="json")]


class OrderBase(BaseModel):
    order_id: str = Field(min_length=1, max_length=20)
    order_date: date
    ship_date: date
    ship_mode: str = Field(min_length=1, max_length=30)
    customer_name: str = Field(min_length=1, max_length=100)
    segment: str = Field(min_length=1, max_length=30)
    city: str = Field(min_length=1, max_length=100)
    state: str = Field(min_length=1, max_length=100)
    region: str = Field(min_length=1, max_length=30)
    category: str = Field(min_length=1, max_length=50)
    sub_category: str = Field(min_length=1, max_length=50)
    product_name: str = Field(min_length=1, max_length=255)
    sales: Money = Field(ge=0, max_digits=12, decimal_places=2)
    quantity: int = Field(ge=1)
    discount: Money = Field(ge=0, le=1, max_digits=4, decimal_places=2)
    profit: Money = Field(max_digits=12, decimal_places=2)


class OrderCreate(OrderBase):
    @model_validator(mode="after")
    def check_dates(self):
        if self.ship_date < self.order_date:
            raise ValueError("ship_date cannot be before order_date")
        return self


class OrderUpdate(BaseModel):
    order_id: str | None = Field(default=None, min_length=1, max_length=20)
    order_date: date | None = None
    ship_date: date | None = None
    ship_mode: str | None = Field(default=None, min_length=1, max_length=30)
    customer_name: str | None = Field(default=None, min_length=1, max_length=100)
    segment: str | None = Field(default=None, min_length=1, max_length=30)
    city: str | None = Field(default=None, min_length=1, max_length=100)
    state: str | None = Field(default=None, min_length=1, max_length=100)
    region: str | None = Field(default=None, min_length=1, max_length=30)
    category: str | None = Field(default=None, min_length=1, max_length=50)
    sub_category: str | None = Field(default=None, min_length=1, max_length=50)
    product_name: str | None = Field(default=None, min_length=1, max_length=255)
    sales: Money | None = Field(default=None, ge=0, max_digits=12, decimal_places=2)
    quantity: int | None = Field(default=None, ge=1)
    discount: Money | None = Field(default=None, ge=0, le=1, max_digits=4, decimal_places=2)
    profit: Money | None = Field(default=None, max_digits=12, decimal_places=2)


class OrderOut(OrderBase):
    model_config = ConfigDict(from_attributes=True)

    id: int


class OrderPage(BaseModel):
    items: list[OrderOut]
    total: int
    page: int
    page_size: int
