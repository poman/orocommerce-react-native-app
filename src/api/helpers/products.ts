import api from '../api';
import { PRODUCTS_ENDPOINT, PRODUCTSEARCH_ENDPOINT } from '../endpoints';
import { IJsonApiListResponse, IQueryParams } from '../types';

export interface IProductImageFile {
  url: string;
  maxWidth: number | string | null;
  maxHeight: number | string | null;
  dimension: string;
  url_webp?: string;
  types: string[];
}

export interface IProductImageAttributes {
  updatedAt?: string;
  mimeType?: string;
  types: string[];
  files: IProductImageFile[];
}

export interface IProductPrice {
  price: string;
  currencyId: string;
  quantity: string;
  unit: string;
}

export interface IProductAttributes {
  sku: string;
  name: string;
  shortDescription?: string;
  description?: string;
  availability_date?: string;
  price?: number;
  currency?: string;
  unit?: string;
  inventory_status?: string;
  prices?: IProductPrice[];
  unitPrecisions?: Array<{
    unit: string;
    precision: number;
    conversionRate: number;
    sell: boolean;
  }>;
  [key: string]: any;
}

export interface IProductRelationships {
  category?: { data: { id: string; type: string } | null };
  images?: { data: Array<{ id: string; type: string }> };
  unitPrecisions?: { data: Array<{ id: string; type: string }> };
  inventory_status?: { data: { id: string; type: string } | null };
}

export interface IProductImage {
  id: string;
  type: string;
  attributes: IProductImageAttributes;
}

export interface IProduct {
  id: string;
  type: string;
  attributes: IProductAttributes;
  relationships?: IProductRelationships;
  images?: IProductImage[];
}

export interface IGetProductsParams extends IQueryParams {
  page?: {
    number?: number;
    size?: number;
  };
  include?: string;
  fields?: Record<string, string>;
  sort?: string;
  filter?: {
    searchQuery?: string;
    category?: string;
    featured?: string;
    newArrival?: string;
  };
}

export const getProducts = async (
  params?: IGetProductsParams
): Promise<{ data: IProduct[]; total: number }> => {
  const queryParams = new URLSearchParams();

  // Pagination
  if (params?.page?.number) {
    queryParams.append('page[number]', params.page.number.toString());
  }
  if (params?.page?.size) {
    queryParams.append('page[size]', params.page.size.toString());
  }

  const includeParams = params?.include ? `images,${params.include}` : 'images';
  queryParams.append('include', includeParams);

  // Fields
  if (params?.fields) {
    Object.entries(params.fields).forEach(([type, fields]) => {
      queryParams.append(`fields[${type}]`, fields);
    });
  }

  if (params?.filter?.searchQuery) {
    queryParams.append('filter[searchQuery]', params.filter.searchQuery);
  }

  // Filter by category
  if (params?.filter?.category) {
    queryParams.append('filter[category]', params.filter.category);
  }

  // Filter by featured
  if (params?.filter?.featured) {
    queryParams.append('filter[featured]', params.filter.featured);
  }

  // Filter by newArrival
  if (params?.filter?.newArrival) {
    queryParams.append('filter[newArrival]', params.filter.newArrival);
  }

  // Sorting
  if (params?.sort) {
    queryParams.append('sort', params.sort);
  }

  const url = `${PRODUCTS_ENDPOINT}${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;

  const response =
    await api.get<IJsonApiListResponse<IProductAttributes, IProductRelationships>>(url);

  // Parse included data (images and inventory status)
  const includedImages = new Map<string, IProductImage>();
  const inventoryStatusMap = new Map<string, any>();

  if (response.data.included) {
    response.data.included.forEach((item: any) => {
      if (item.type === 'productimages') {
        includedImages.set(item.id, {
          id: item.id,
          type: item.type,
          attributes: item.attributes,
        });
      } else if (item.type === 'productinventorystatuses') {
        inventoryStatusMap.set(item.id, item);
      }
    });
  }

  const products = response.data.data.map((item: any) => {
    // Get images from relationships
    const productImages: IProductImage[] = [];
    if (item.relationships?.images?.data) {
      item.relationships.images.data.forEach((imageRef: { id: string; type: string }) => {
        const image = includedImages.get(imageRef.id);
        if (image) {
          productImages.push(image);
        }
      });
    }

    if (item.relationships?.inventoryStatus?.data?.id) {
      const statusId = item.relationships.inventoryStatus.data.id;
      const statusData = inventoryStatusMap.get(statusId);
      if (statusData) {
        item.attributes.inventory_status =
          statusData.attributes?.name || statusData.attributes?.label || statusId;
      }
    }

    return {
      id: item.id,
      type: item.type,
      attributes: item.attributes,
      relationships: item.relationships,
      images: productImages,
    };
  });

  const total = response.data.meta?.totalCount || products.length;

  return {
    data: products,
    total,
  };
};

export const getProductsBySkus = async (
  skus: string[],
  params?: Omit<IGetProductsParams, 'filter'>
): Promise<{ data: IProduct[]; total: number }> => {
  if (skus.length === 0) {
    return { data: [], total: 0 };
  }

  const queryParams = new URLSearchParams();

  // Pagination
  if (params?.page?.number) {
    queryParams.append('page[number]', params.page.number.toString());
  }
  if (params?.page?.size) {
    queryParams.append('page[size]', params.page.size.toString());
  }

  if (params?.include) {
    queryParams.append('include', params.include);
  }

  if (params?.fields) {
    Object.entries(params.fields).forEach(([type, fields]) => {
      queryParams.append(`fields[${type}]`, fields);
    });
  }

  const skuList = skus.map(sku => `"${sku}"`).join(', ');
  const searchQuery = `sku in (${skuList})`;
  queryParams.append('filter[searchQuery]', searchQuery);

  const sortParam = params?.sort || 'relevance';
  queryParams.append('sort', sortParam);

  const url = `${PRODUCTSEARCH_ENDPOINT}?${queryParams.toString()}`;

  const response =
    await api.get<IJsonApiListResponse<IProductAttributes, IProductRelationships>>(url);

  const inventoryStatusMap = new Map<string, any>();
  if (response.data.included) {
    response.data.included.forEach((item: any) => {
      if (item.type === 'productinventorystatuses') {
        inventoryStatusMap.set(item.id, item);
      }
    });
  }

  const products = response.data.data.map((item: any) => {
    const productImages: IProductImage[] = [];

    if (item.attributes?.images && Array.isArray(item.attributes.images)) {
      item.attributes.images.forEach((img: any, index: number) => {
        const imageFile: IProductImageFile = {
          url: img.url,
          maxWidth: null,
          maxHeight: null,
          dimension:
            img.type === 'large'
              ? 'product_large'
              : img.type === 'medium'
                ? 'product_medium'
                : 'product_small',
          types: [img.type],
        };

        productImages.push({
          id: `${item.id}-image-${index}`,
          type: 'productimages',
          attributes: {
            types: [img.type],
            files: [imageFile],
          },
        });
      });
    }

    if (item.relationships?.inventoryStatus?.data?.id) {
      const statusId = item.relationships.inventoryStatus.data.id;
      const statusData = inventoryStatusMap.get(statusId);
      if (statusData) {
        item.attributes.inventory_status =
          statusData.attributes?.name || statusData.attributes?.label || statusId;
      }
    }

    return {
      id: item.id,
      type: item.type,
      attributes: item.attributes,
      relationships: item.relationships,
      images: productImages,
    };
  });

  const total = response.data.meta?.totalCount || products.length;

  return {
    data: products,
    total,
  };
};

/**
 * Search products using the /api/productsearch endpoint
 * This endpoint uses a high-performance search with indexed products information
 *
 * @returns Search results with products and total count
 * @param params
 */
export const searchProducts = async (params: {
  searchQuery: string;
  page?: { number: number; size: number };
  sort?: string;
}): Promise<{ products: IProduct[]; total: number }> => {
  const queryParams = new URLSearchParams();

  // Pagination
  if (params?.page?.number) {
    queryParams.append('page[number]', params.page.number.toString());
  }
  if (params?.page?.size) {
    queryParams.append('page[size]', params.page.size.toString());
  }

  if (params.searchQuery) {
    queryParams.append('filter[searchQuery]', params.searchQuery);
  }

  queryParams.append('include', 'inventoryStatus,unitPrecisions');

  // Sorting (relevance is default for search)
  const sortParam = params?.sort || 'relevance';
  queryParams.append('sort', sortParam);

  const url = `${PRODUCTSEARCH_ENDPOINT}?${queryParams.toString()}`;

  const response =
    await api.get<IJsonApiListResponse<IProductAttributes, IProductRelationships>>(url);

  const inventoryStatusMap = new Map<string, any>();
  const unitPrecisionsMap = new Map<string, any>();

  if (response.data.included) {
    response.data.included.forEach((item: any) => {
      if (item.type === 'productinventorystatuses') {
        inventoryStatusMap.set(item.id, item);
      } else if (item.type === 'productunitprecisions') {
        unitPrecisionsMap.set(item.id, item);
      }
    });
  }

  const products = response.data.data.map((item: any) => {
    const productImages: IProductImage[] = [];

    // productsearch returns images directly in attributes.images array
    if (item.attributes?.images && Array.isArray(item.attributes.images)) {
      item.attributes.images.forEach((img: any, index: number) => {
        // Map productsearch image format to IProductImage format
        const imageFile: IProductImageFile = {
          url: img.url,
          url_webp: img.url_webp,
          maxWidth: null,
          maxHeight: null,
          dimension:
            img.type === 'large'
              ? 'product_large'
              : img.type === 'medium'
                ? 'product_medium'
                : 'product_small',
          types: [img.type],
        };

        productImages.push({
          id: `${item.id}-image-${index}`,
          type: 'productimages',
          attributes: {
            types: [img.type],
            files: [imageFile],
          },
        });
      });
    }

    if (item.relationships?.inventoryStatus?.data?.id) {
      const statusId = item.relationships.inventoryStatus.data.id;
      const statusData = inventoryStatusMap.get(statusId);
      if (statusData) {
        item.attributes.inventory_status =
          statusData.attributes?.name || statusData.attributes?.label || statusId;
      }
    }

    if (
      item.relationships?.unitPrecisions?.data &&
      Array.isArray(item.relationships.unitPrecisions.data)
    ) {
      item.attributes.unitPrecisions = item.relationships.unitPrecisions.data.map((upRef: any) => {
        const upData = unitPrecisionsMap.get(upRef.id);
        return upData?.attributes || {};
      });
    }

    return {
      id: item.id,
      type: item.type,
      attributes: item.attributes,
      relationships: item.relationships,
      images: productImages,
    };
  });

  const total = response.data.meta?.totalCount || products.length;

  return {
    products,
    total,
  };
};

/**
 * Get products by SKUs
 * Fetches multiple products by their SKUs for recently viewed functionality
 *
 * @param skus - Array of product SKUs
 * @param baseUrl - Base URL for API
 * @param getValidAccessToken - Function to get valid access token
 * @returns Array of products
 */
export const getProductsByIds = async (
  skus: string[],
  baseUrl: string,
  getValidAccessToken?: () => Promise<string | null>
): Promise<IProduct[]> => {
  if (skus.length === 0) return [];

  try {
    const { initializeApi, setAuthTokenGetter } = await import('../api');
    initializeApi(baseUrl);
    if (getValidAccessToken) {
      setAuthTokenGetter(getValidAccessToken);
    }

    // Build filter query: sku in ("SKU1", "SKU2", ...)
    const skuList = skus.map(sku => `"${sku}"`).join(', ');
    const searchQuery = `sku in (${skuList})`;

    const queryParams = new URLSearchParams();
    queryParams.append('filter[searchQuery]', searchQuery);
    queryParams.append('include', 'inventoryStatus');
    queryParams.append('page[size]', '50'); // Max items for recently viewed

    const url = `${PRODUCTSEARCH_ENDPOINT}?${queryParams.toString()}`;

    const response =
      await api.get<IJsonApiListResponse<IProductAttributes, IProductRelationships>>(url);

    const inventoryStatusMap = new Map<string, any>();
    if (response.data.included) {
      response.data.included.forEach((item: any) => {
        if (item.type === 'productinventorystatuses') {
          inventoryStatusMap.set(item.id, item);
        }
      });
    }

    return response.data.data.map((item: any) => {
      const productImages: IProductImage[] = [];

      // Parse images from attributes.images (productsearch format)
      if (item.attributes?.images && Array.isArray(item.attributes.images)) {
        item.attributes.images.forEach((img: any, index: number) => {
          const imageFile: IProductImageFile = {
            url: img.url,
            maxWidth: null,
            maxHeight: null,
            dimension:
              img.type === 'large'
                ? 'product_large'
                : img.type === 'medium'
                  ? 'product_medium'
                  : 'product_small',
            types: [img.type || 'listing'],
          };

          productImages.push({
            id: `${item.id}-image-${index}`,
            type: 'productimages',
            attributes: {
              types: [img.type || 'listing'],
              files: [imageFile],
            },
          });
        });
      }

      if (item.relationships?.inventoryStatus?.data?.id) {
        const statusId = item.relationships.inventoryStatus.data.id;
        const statusData = inventoryStatusMap.get(statusId);
        if (statusData) {
          item.attributes.inventory_status =
            statusData.attributes?.name || statusData.attributes?.label || statusId;
        }
      }

      return {
        id: item.id,
        type: item.type,
        attributes: item.attributes,
        relationships: item.relationships,
        images: productImages,
      };
    });
  } catch (_error) {
    return [];
  }
};
