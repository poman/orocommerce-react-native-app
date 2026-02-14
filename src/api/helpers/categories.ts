import { Platform } from 'react-native';
import api from '../api';
import { IJsonApiResponse } from '../types';
import { MASTER_CATALOG_CATEGORIES_ENDPOINT, MASTER_CATALOG_TREE_ENDPOINT } from '../endpoints';

export interface ICategoryEntity {
  id: string;
  title: string;
  level: number;
  parentCategory?: string;
  materialized_path?: string;
  shortDescription?: string;
  description?: string;
}

export interface ICategory {
  id: string;
  type: string;
  attributes: {
    title: string;
    level: number;
    parentCategory?: string;
    materialized_path?: string;
    shortDescription?: string;
    description?: string;
  };
  relationships?: {
    parentCategory?: {
      data: {
        type: string;
        id: string;
      } | null;
    };
    categoryPath?: {
      data: Array<{
        type: string;
        id: string;
      }>;
    };
  };
}

export interface IGetCategoriesParams {
  page?: {
    number?: number;
    size?: number;
  };
  filter?: {
    parentCategory?: string;
  };
  include?: string;
}

/**
 * Get master catalog categories
 */
export const getCategories = async (
  params?: IGetCategoriesParams
): Promise<{ data: ICategory[]; total: number; included?: any[] }> => {
  const queryParams = new URLSearchParams();

  if (params?.page?.number) {
    queryParams.append('page[number]', params.page.number.toString());
  }
  if (params?.page?.size) {
    queryParams.append('page[size]', params.page.size.toString());
  }
  if (params?.filter?.parentCategory) {
    queryParams.append('filter[parentCategory]', params.filter.parentCategory);
  }
  if (params?.include) {
    queryParams.append('include', params.include);
  }

  const url = queryParams.toString()
    ? `${MASTER_CATALOG_CATEGORIES_ENDPOINT}?${queryParams.toString()}`
    : MASTER_CATALOG_CATEGORIES_ENDPOINT;

  const config = Platform.OS === 'web' ? { withCredentials: true } : {};
  const response = await api.get<IJsonApiResponse<ICategoryEntity>>(url, config);

  const data: ICategory[] = Array.isArray(response.data.data)
    ? response.data.data.map(item => ({
        id: item.id,
        type: item.type,
        attributes: item.attributes,
        relationships: item.relationships,
      }))
    : [
        {
          id: response.data.data.id,
          type: response.data.data.type,
          attributes: response.data.data.attributes,
          relationships: response.data.data.relationships,
        },
      ];

  return {
    data,
    total: response.data.meta?.totalItems || data.length,
    included: response.data.included,
  };
};

/**
 * Get master catalog tree (hierarchy)
 */
export const getCategoryTree = async (): Promise<{ data: any[]; included?: any[] }> => {
  const config = Platform.OS === 'web' ? { withCredentials: true } : {};
  const response = await api.get<IJsonApiResponse<any>>(MASTER_CATALOG_TREE_ENDPOINT, config);

  const data = Array.isArray(response.data.data) ? response.data.data : [response.data.data];

  return {
    data,
    included: response.data.included,
  };
};

/**
 * Get category by ID
 */
export const getCategoryById = async (id: string): Promise<ICategory> => {
  const config = Platform.OS === 'web' ? { withCredentials: true } : {};
  const response = await api.get<IJsonApiResponse<ICategoryEntity>>(
    `${MASTER_CATALOG_CATEGORIES_ENDPOINT}/${id}`,
    config
  );

  const data = Array.isArray(response.data.data) ? response.data.data[0] : response.data.data;

  return {
    id: data.id,
    type: data.type,
    attributes: data.attributes,
    relationships: data.relationships,
  };
};
