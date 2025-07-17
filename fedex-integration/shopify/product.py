from typing import Optional
from datetime import datetime, timedelta

from shopify.graphql_query import vairant_query, PRODUCT_QUERY, METAFIELD_DELETE_QUERY

from .client import ShopifyClient


async def get_products_data(sku: str) -> Optional[dict]:
    client = await ShopifyClient().load()
    products_data = await client.execute_gql(
        query=vairant_query, variables={'query': f'sku:{sku}'}
    )
    product_list = products_data['products']['nodes']
    if not product_list:
        return None
    result_sku = product_list[0]['sku']['value']
    if result_sku != sku:
        return None
    return product_list[0]['variants']['nodes'][0]


async def clean_up_outdated_shipment_metafields():
    metafields_to_delete = []
    async for variant in get_all_products():
        variant_id = variant.get("id")
        expected_ship_date = variant.get("expected_ship_date").get("value")
        date_obj = datetime.strptime(expected_ship_date, "%Y-%m-%d")
        yesterday = datetime.today() - timedelta(days=1)
        if date_obj < yesterday:
            expected_ship_date_metafield_input = {
                "ownerId": variant_id,
                "namespace": "custom",
                "key": "expected_ship_date",
            }
            shipment_metafield_input = {
                "ownerId": variant_id,
                "namespace": "custom",
                "key": "incoming_shipment",
            }
            metafields_to_delete.append(expected_ship_date_metafield_input)
            metafields_to_delete.append(shipment_metafield_input)
    if metafields_to_delete:
        await delete_shipment_metafields(metafields_to_delete)


async def get_all_products():
    client = await ShopifyClient().load()
    has_next_page = True
    cursor = None
    while has_next_page:
        query_variables = {"cursor": cursor}
        response = await client.execute_gql(query=PRODUCT_QUERY, variables=query_variables)
        products = response["products"]["nodes"]
        for product in products:
            variants = product.get("variants").get("nodes")
            for variant in variants:
                expected_ship_date = variant.get("expected_ship_date")

                if expected_ship_date:
                    yield variant

        page_info = response["products"]["pageInfo"]
        has_next_page = page_info["hasNextPage"]
        cursor = page_info["endCursor"]


async def delete_shipment_metafields(metafields):
    client = await ShopifyClient().load()
    query_variables = {"metafields": metafields}
    response = await client.execute_gql(query=METAFIELD_DELETE_QUERY, variables=query_variables)
    return response
