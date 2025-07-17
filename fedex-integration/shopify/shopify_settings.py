from pydantic_settings import BaseSettings


class ShopifyConfigurations(BaseSettings):
    shopify_access_token: str
    shopify_store_name: str


conf = ShopifyConfigurations()
