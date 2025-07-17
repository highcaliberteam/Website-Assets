from typing import Optional

from pydantic import BaseModel


class ProductInfo(BaseModel):
    number_of_carton: int
    qty_per_carton: int
    total_weight: float
    dimension: str
    weight: float
    height: Optional[int]
    width: Optional[int]
    length: Optional[int]
    packages: list[dict] = []
