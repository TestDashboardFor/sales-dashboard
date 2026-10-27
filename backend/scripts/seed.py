import csv
from datetime import datetime
from pathlib import Path

from sqlalchemy import func, select

from app.db import SessionLocal
from app.models import Order

CSV_PATH = Path(__file__).resolve().parent.parent / "data" / "superstore.csv"


def parse_date(value: str):
    return datetime.strptime(value, "%m/%d/%Y").date()


def main() -> None:
    with SessionLocal() as db:
        if db.scalar(select(func.count()).select_from(Order)):
            print("orders already seeded, skipping")
            return
        with open(CSV_PATH, encoding="utf-8", newline="") as f:
            orders = [
                Order(
                    order_id=r["Order ID"],
                    order_date=parse_date(r["Order Date"]),
                    ship_date=parse_date(r["Ship Date"]),
                    ship_mode=r["Ship Mode"],
                    customer_name=r["Customer Name"],
                    segment=r["Segment"],
                    city=r["City"],
                    state=r["State"],
                    region=r["Region"],
                    category=r["Category"],
                    sub_category=r["Sub-Category"],
                    product_name=r["Product Name"],
                    sales=r["Sales"],
                    quantity=int(r["Quantity"]),
                    discount=r["Discount"],
                    profit=r["Profit"],
                )
                for r in csv.DictReader(f)
            ]
        db.add_all(orders)
        db.commit()
        print(f"seeded {len(orders)} orders")


if __name__ == "__main__":
    main()
