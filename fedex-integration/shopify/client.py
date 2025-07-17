from typing import ClassVar, Optional

from httpx import AsyncClient
from spylib.admin_api import PrivateTokenABC

from shopify.shopify_settings import conf


class ShopifyClient(PrivateTokenABC):
    """
    The client to make calls to the Shopify Admin APIs
    """

    store_name: str = conf.shopify_store_name
    access_token: str = conf.shopify_access_token
    api_version: ClassVar[Optional[str]] = '2024-01'
    client: ClassVar[AsyncClient] = AsyncClient(timeout=15)

    @classmethod
    async def load(cls):
        """
        Load the store target and access token to be used from the configuration
        """
        return cls(store_name=conf.shopify_store_name, access_token=conf.shopify_access_token)

    async def save(self):
        pass
