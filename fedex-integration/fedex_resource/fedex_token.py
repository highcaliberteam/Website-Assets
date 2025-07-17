import requests
from loguru import logger

from fedex_resource.fedex_settings import conf


def get_token() -> str:
    url = f"{conf.fedex_base_url}/oauth/token"

    payload = {
        "grant_type": "client_credentials",
        "client_id": conf.fedex_client_id,
        "client_secret": conf.fedex_access_secret,
    }
    headers = {'Content-Type': "application/x-www-form-urlencoded"}

    response = requests.post(url, data=payload, headers=headers)

    respjson = response.json()
    logger.info('Token acquired')
    return respjson['access_token']
