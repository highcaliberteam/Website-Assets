vairant_query = """
query SearchProduct($query: String) {
  products(first: 1, query: $query){
    nodes {
      sku: metafield(namespace: "custom", key: "sku"){
        value
      }
      variants(first:1){
        nodes {
          id
        legacyResourceId
        weight: metafield(namespace: "custom", key: "weight_per_carton"){
          value
        }
        piece: metafield(namespace: "custom", key: "items_in_carton"){
          value
        }
        length: metafield(namespace: "custom", key: "package_length"){
          value
        }
        width: metafield(namespace: "custom", key: "package_width"){
          value
        }
        height: metafield(namespace: "custom", key: "package_height"){
          value
        }
        }
      }
    }
  }
}
"""

METAOBJECT_SEARCH_QUERY = """
query SearchMoreOrderMetaObjects($cursor: String) {
  metaobjects(first: 250, type: "orders", after: $cursor) {
    nodes {
      id
      handle
      displayName
      fields {
        key
        value
      }
      status: field(key: "status") {
        value
      }
      updatedAt
    }
    pageInfo {
      endCursor
      hasNextPage
    }
  }
}
"""

METAOBJECT_DELETE_MUTATION = """
mutation OrderMetaObjectDelete($ids:[ID!]) {
  metaobjectBulkDelete(where:{ids: $ids}){
    userErrors{
      message
      field
    }
  }
}
"""

PRODUCT_QUERY = """
query GetProducts($cursor: String) {
  products(first: 250, after: $cursor){
    nodes {
      id
      variants(first:50){
        nodes {
          id
          expected_ship_date: metafield(namespace: "custom", key: "expected_ship_date"){
            id
            value
          }
          incoming_shipment: metafield(namespace:"custom", key: "incoming_shipment") {
            id
            value
          }
        }
      }
    }
    pageInfo {
      endCursor
      hasNextPage
    }
  }
}
"""

METAFIELD_DELETE_QUERY = """
mutation MetafieldsDelete($metafields: [MetafieldIdentifierInput!]!) {
  metafieldsDelete(metafields: $metafields) {
    deletedMetafields {
      key
      namespace
      ownerId
    }
    userErrors {
      field
      message
    }
  }
}
"""
