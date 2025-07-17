import json

import requests

from data_models.product_info import ProductInfo
from fedex_resource.fedex_settings import conf
from fedex_resource.fedex_token import get_token
from fedex_resource.postal_code import get_state_data


def calculate_freight_rate(postal_code: str, product_info: ProductInfo):
    url = f"{conf.fedex_base_url}/rate/v1/rates/quotes"
    state_code, city_name = get_state_data(postal_code)

    payload = prepare_payload(state_code, city_name, postal_code, product_info=product_info)

    headers = {
        'Content-Type': "application/json",
        'X-locale': "en_US",
        'Authorization': f"Bearer {get_token()}",
    }

    response = requests.post(url, data=json.dumps(payload), headers=headers)
    respjson = response.json()
    return respjson


def prepare_payload(
    state_code: str,
    city_name: str,
    postal_code: str,
    product_info: ProductInfo,
):
    requested_package = []
    for pack in product_info.packages:
        requested_package.append(
            {
                "groupPackageCount": pack["number"],
                "weight": {"units": "LB", "value": pack["weight"]},
                "subPackagingType": "CARTON",
                "dimensions": {
                    "length": product_info.length,
                    "width": product_info.width,
                    "height": product_info.height,
                    "units": "IN",
                },
            }
        )
    return {
        "rateRequestControlParameters": {
            "returnTransitTimes": True,
        },
        "accountNumber": {
            "value": conf.fedex_account_number,
        },
        "requestedShipment": {
            # Fixed
            "shipper": {
                "address": {
                    "city": "Azusa",
                    "stateOrProvinceCode": "CA",
                    "postalCode": "91702",
                    "countryCode": "US",
                }
            },
            # From the user
            "recipient": {
                "address": {
                    "city": city_name,
                    "stateOrProvinceCode": state_code,
                    "postalCode": postal_code,
                    "countryCode": "US",
                }
            },
            "pickupType": "DROPOFF_AT_FEDEX_LOCATION",
            "rateRequestType": ["LIST", "ACCOUNT"],
            "requestedPackageLineItems": requested_package,
        },
    }
