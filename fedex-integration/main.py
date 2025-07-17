import math
from contextlib import asynccontextmanager
from datetime import datetime, timedelta
from typing import Any, Optional

import holidays
from apscheduler.schedulers.asyncio import AsyncIOScheduler
from dateutil.parser import parse
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from loguru import logger
from pydantic import BaseModel

from data_models.product_info import ProductInfo
from fedex_resource.fedex_freight import calculate_freight_rate
from fedex_resource.postal_code import get_state_data
from shopify.metaobject import clean_up_metaobjects
from shopify.product import get_products_data, clean_up_outdated_shipment_metafields


@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info("Application started")
    scheduler = AsyncIOScheduler()
    job_id = 'clean_up_orders'
    scheduler.remove_all_jobs()
    scheduler.add_job(clean_up_metaobjects, 'cron', day_of_week='mon', hour=0, minute=0, id=job_id)
    scheduler.add_job(clean_up_outdated_shipment_metafields, 'cron', hour=0, minute=0)
    scheduler.start()
    scheduler.print_jobs()
    yield
    scheduler.shutdown()
    logger.info("Application shutdown")


app = FastAPI(lifespan=lifespan)


origins = [
    "http://localhost",
    "http://localhost:8080",
    "https://2ffbe4-ad.myshopify.com",
    "https://highcaliberline.com",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/")
async def root():
    return "Fedex freight rate calculator"


class RateQuoteRequest(BaseModel):
    postal_code: str
    sku: str
    quantity: int


class FreightRate(BaseModel):
    service_name: str
    service_type: str
    transit_time: str
    delivery_time: str
    fedex_price: float
    your_cost: Optional[float] = None


class FreightRateResponse(BaseModel):
    product_info: Optional[ProductInfo] = None
    rates: list[FreightRate] = []
    error: Any = None


US_HOLIDAYS = holidays.US()


@app.options("/fedex")
async def handle_fedex_options():
    return "OK"


@app.post("/fedex")
async def handle_fedex(quote_request: RateQuoteRequest):
    try:
        product_data = await get_products_data(sku=quote_request.sku)
        if not product_data:
            return FreightRateResponse(error="Product not found")

        product_info = collect_product_info(product_data, quote_request.quantity)

        rate_data = calculate_freight_rate(
            postal_code=quote_request.postal_code,
            product_info=product_info,
        )
        state_code, _city_name = get_state_data(quote_request.postal_code)
        if 'errors' in rate_data:
            logger.error("Error occurred while calculating rate")
            return FreightRateResponse(error=rate_data['errors'])

        logger.info("Rate calculated successfully")
        rates = collect_rates(rate_data, state_code)
        return FreightRateResponse(
            product_info=product_info,
            rates=rates,
        )
    except Exception as e:
        return HTTPException(status_code=500, detail=str(e))


def collect_rates(rate_data: dict, state_code: str) -> list[FreightRate]:
    rates = []
    for rate in rate_data['output']['rateReplyDetails']:
        if rate['serviceName'] == 'FedEx Ground®' and state_code in ['HI', 'AK']:
            continue
        delivery_date = rate['commit']['dateDetail']['dayFormat']
        delivery_day_of_week = rate['commit']['dateDetail']['dayOfWeek']
        your_cost = 0
        fedex_cost = 0
        rated_shipment_details = rate.get('ratedShipmentDetails')
        for rate_detail in rated_shipment_details:
            if rate_detail['rateType'] == 'ACCOUNT':
                your_cost = rate_detail['totalNetFedExCharge']
                zone = rate_detail['shipmentRateDetail']['rateZone']
            if rate_detail['rateType'] == 'LIST':
                fedex_cost = rate_detail['totalNetFedExCharge']
        fedex_cost_display = round(fedex_cost * 1.75, 2)
        your_cost_display = round(your_cost * 1.8, 2)

        rate_resp = FreightRate(
            service_name=rate['serviceName'],
            service_type=rate['serviceType'],
            transit_time=calculate_transit_days(delivery_date),
            delivery_time=f'{delivery_day_of_week}, {delivery_date}',
            fedex_price=fedex_cost_display,
            your_cost=your_cost_display,
        )
        rates.append(rate_resp)
        if rate['serviceName'] == 'FedEx Ground®' and zone in ['7', '8']:
            equalization_cost = round(your_cost * 1.4, 2)
            another_rate = rate_resp = FreightRate(
                service_name='Freight Equalization',
                service_type='EQUALIZATION',
                transit_time=calculate_transit_days(delivery_date),
                delivery_time=f'{delivery_day_of_week}, {delivery_date}',
                fedex_price=fedex_cost_display,
                your_cost=equalization_cost,
            )
            rates.append(another_rate)
    rates = sort_rates(rates)
    return rates


def collect_product_info(product_data: dict, quantity: int) -> ProductInfo:
    weight = product_data['weight']['value']
    piece = product_data['piece']['value']
    length = product_data['length']['value']
    width = product_data['width']['value']
    height = product_data['height']['value']
    dimension = f'{length}x{height}x{width}'
    number_of_carton = math.ceil(quantity / int(piece))

    if weight is None:
        weight = 10
    else:
        weight = float(weight)

    packages = []

    if quantity % int(piece) != 0:
        left_over = quantity % int(piece)
        packages.append(
            {
                'weight': weight * (left_over / int(piece)),
                'number': 1,
            }
        )
        if number_of_carton - 1 > 0:
            packages.append(
                {
                    'weight': weight,
                    'number': number_of_carton - 1,
                }
            )
    else:
        packages.append(
            {
                'weight': weight,
                'number': number_of_carton,
            }
        )

    total_weight = math.ceil((float(weight) / int(piece)) * quantity)
    return ProductInfo(
        number_of_carton=number_of_carton,
        qty_per_carton=int(piece),
        total_weight=total_weight,
        dimension=dimension,
        weight=weight,
        height=height,
        width=width,
        length=length,
        packages=packages,
    )


def calculate_transit_days(date_str: str) -> str:
    # Parse the input date string to a datetime object
    target_date = parse(date_str).date()

    # Get the current date
    today = datetime.now().date()

    # Initialize the count of business days
    business_days = 0

    # Iterate through each day between today and the target date
    current_date = today
    while current_date < target_date:
        # Check if the current day is a weekday (Monday to Friday)
        if current_date.weekday() < 5:
            business_days += 1
        # Move to the next day
        current_date += timedelta(days=1)

    if business_days == 1:
        return '1 day'
    # Return the number of business days
    return f'{business_days} days'


def sort_rates(rates: list[FreightRate]) -> list[FreightRate]:
    sort_standard = [
        "FEDEX_GROUND",
        "EQUALIZATION",
        "FEDEX_EXPRESS_SAVER",
        "FEDEX_2_DAY",
        "FEDEX_2_DAY_AM",
        "STANDARD_OVERNIGHT",
        "PRIORITY_OVERNIGHT",
    ]
    disable_methods = ['FIRST_OVERNIGHT', 'FEDEX_2_DAY_AM']

    # Filter out rates with service types in disable_methods
    filtered_rates = [rate for rate in rates if rate.service_type not in disable_methods]

    return sorted(
        filtered_rates,
        key=lambda x: (
            sort_standard.index(x.service_type)
            if x.service_type in sort_standard
            else len(sort_standard)
        ),
    )
