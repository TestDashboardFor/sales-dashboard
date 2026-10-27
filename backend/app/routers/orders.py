from typing import Annotated, Literal

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import func, or_, select

from app.deps import DbSession, get_current_user
from app.models import Order
from app.schemas.order import OrderCreate, OrderOut, OrderPage, OrderUpdate
from app.services.filters import OrderFilters, get_filters

router = APIRouter(prefix="/orders", tags=["orders"], dependencies=[Depends(get_current_user)])

SortField = Literal[
    "order_date", "order_id", "customer_name", "region", "category",
    "sub_category", "segment", "sales", "quantity", "discount", "profit",
]


def get_order_or_404(db: DbSession, order_id: int) -> Order:
    order = db.get(Order, order_id)
    if order is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Order not found")
    return order


@router.get("", response_model=OrderPage)
def list_orders(
    db: DbSession,
    filters: Annotated[OrderFilters, Depends(get_filters)],
    page: Annotated[int, Query(ge=1)] = 1,
    page_size: Annotated[int, Query(ge=1, le=100)] = 20,
    sort_by: SortField = "order_date",
    sort_dir: Literal["asc", "desc"] = "desc",
    search: Annotated[str | None, Query(max_length=100)] = None,
):
    stmt = filters.apply(select(Order))
    if search:
        pattern = f"%{search}%"
        stmt = stmt.where(
            or_(
                Order.product_name.ilike(pattern),
                Order.customer_name.ilike(pattern),
                Order.order_id.ilike(pattern),
            )
        )

    total = db.scalar(select(func.count()).select_from(stmt.subquery()))
    column = getattr(Order, sort_by)
    ordering = column.asc() if sort_dir == "asc" else column.desc()
    items = db.scalars(
        stmt.order_by(ordering, Order.id).offset((page - 1) * page_size).limit(page_size)
    ).all()
    return OrderPage(items=items, total=total, page=page, page_size=page_size)


@router.get("/{order_id}", response_model=OrderOut)
def get_order(order: Annotated[Order, Depends(get_order_or_404)]):
    return order


@router.post("", response_model=OrderOut, status_code=status.HTTP_201_CREATED)
def create_order(data: OrderCreate, db: DbSession):
    order = Order(**data.model_dump())
    db.add(order)
    db.commit()
    return order


@router.patch("/{order_id}", response_model=OrderOut)
def update_order(
    data: OrderUpdate, order: Annotated[Order, Depends(get_order_or_404)], db: DbSession
):
    for field, value in data.model_dump(exclude_unset=True).items():
        setattr(order, field, value)
    if order.ship_date < order.order_date:
        raise HTTPException(status.HTTP_422_UNPROCESSABLE_ENTITY, "ship_date cannot be before order_date")
    db.commit()
    return order


@router.delete("/{order_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_order(order: Annotated[Order, Depends(get_order_or_404)], db: DbSession):
    db.delete(order)
    db.commit()
