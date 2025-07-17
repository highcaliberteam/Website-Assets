from pydantic_settings import BaseSettings


class FedexConfigurations(BaseSettings):
    fedex_access_secret: str
    fedex_client_id: str
    fedex_account_number: str
    fedex_base_url: str


conf = FedexConfigurations()
