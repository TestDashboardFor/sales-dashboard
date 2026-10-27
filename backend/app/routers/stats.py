from typing import Annotated, Literal

from fastapi import APIRouter, Depends
from sqlalchemy import distinct, func, select

from app.deps import DbSession, get_current_user
from app.models import Order
from app.schemas.stats import BreakdownItem, FilterOptions, Summary, TimeseriesPoint
from app.services.filters import OrderFilters, get_filters

router = APIRouter(prefix="/stats", tags=["stats"], dependencies=[Depends(get_current_user)])

Filters = Annotated[OrderFilters, Depends(get_filters)]

BREAKDOWN_COLUMNS = {
    "category": Order.category,
    "sub_category": Order.sub_category,
    "region": Order.region,
    "segment": Order.segment,
}

sales_sum = func.coalesce(func.sum(Order.sales), 0)
profit_sum = func.coalesce(func.sum(Order.profit), 0)
orders_count = func.count(distinct(Order.order_id))


@router.get("/summary", response_model=Summary)
def summary(db: DbSession, filters: Filters):
    stmt = filters.apply(
        select(sales_sum, profit_sum, func.coalesce(func.sum(Order.quantity), 0), orders_count)
    )
    sales, profit, quantity, orders = db.execute(stmt).one()
    return Summary(
        total_sales=sales,
        total_profit=profit,
        total_quantity=quantity,
        orders=orders,
        profit_margin=float(profit / sales) if sales else 0,
    )


@router.get("/timeseries", response_model=list[TimeseriesPoint])
def timeseries(
    db: DbSession, filters: Filters, granularity: Literal["month", "year"] = "month"
):
    period = func.date_trunc(granularity, Order.order_date).label("period")
    stmt = filters.apply(select(period, sales_sum, profit_sum, orders_count)).group_by(period).order_by(period)
    return [
        TimeseriesPoint(period=p.date(), sales=s, profit=pr, orders=o)
        for p, s, pr, o in db.execute(stmt)
    ]


@router.get("/breakdown", response_model=list[BreakdownItem])
def breakdown(
    db: DbSession,
    filters: Filters,
    by: Literal["category", "sub_category", "region", "segment"] = "category",
):
    column = BREAKDOWN_COLUMNS[by]
    stmt = (
        filters.apply(select(column, sales_sum, profit_sum, orders_count))
        .group_by(column)
        .order_by(sales_sum.desc())
    )
    return [
        BreakdownItem(label=label, sales=s, profit=p, orders=o)
        for label, s, p, o in db.execute(stmt)
    ]


@router.get("/options", response_model=FilterOptions)
def options(db: DbSession):
    def distinct_values(column):
        return list(db.scalars(select(column).distinct().order_by(column)))

    date_min, date_max = db.execute(select(func.min(Order.order_date), func.max(Order.order_date))).one()
    return FilterOptions(
        regions=distinct_values(Order.region),
        categories=distinct_values(Order.category),
        segments=distinct_values(Order.segment),
        date_min=date_min,
        date_max=date_max,
    )
