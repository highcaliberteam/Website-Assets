from datetime import datetime, timedelta

from shopify.graphql_query import METAOBJECT_DELETE_MUTATION, METAOBJECT_SEARCH_QUERY

from .client import ShopifyClient


async def clean_up_metaobjects():
    count = 0
    ids_to_delete = []
    async for metaobject in get_order_metaobjects():
        date_string = metaobject['updatedAt']
        if is_more_than_30_days_old(date_string):
            ids_to_delete.append(metaobject['id'])
            count += 1
    if ids_to_delete:
        await bulk_delete_order_metaobjects(ids_to_delete)


async def get_order_metaobjects():
    client = await ShopifyClient().load()
    has_next_page = True
    cursor = None
    while has_next_page:
        query_variables = {"cursor": cursor}
        response = await client.execute_gql(
            query=METAOBJECT_SEARCH_QUERY, variables=query_variables
        )
        metaobjects = response["metaobjects"]["nodes"]
        for metaobject in metaobjects:
            yield metaobject

        page_info = response["metaobjects"]["pageInfo"]
        has_next_page = page_info["hasNextPage"]
        cursor = page_info["endCursor"]


async def bulk_delete_order_metaobjects(ids):
    client = await ShopifyClient().load()
    query_variables = {"ids": ids}
    response = await client.execute_gql(
        query=METAOBJECT_DELETE_MUTATION, variables=query_variables
    )
    return response


def is_more_than_30_days_old(date_string) -> bool:
    # Parse the date string into a datetime object
    date = datetime.strptime(date_string, "%Y-%m-%dT%H:%M:%SZ")
    now = datetime.now()
    difference = now - date
    return difference > timedelta(days=31)
