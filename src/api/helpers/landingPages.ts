import api from '../api';
import { LANDING_PAGES_ENDPOINT } from '../endpoints';

export interface ILandingPageAttributes {
  title?: string;
  content?: string;
  metaTitle?: string;
  metaDescription?: string;
  metaKeywords?: string;
  slug?: string;
  [key: string]: any;
}

export interface ILandingPage {
  id: string;
  type: string;
  attributes: ILandingPageAttributes;
}

export const getLandingPageById = async (id: string): Promise<ILandingPage> => {
  const url = `${LANDING_PAGES_ENDPOINT}/${id}`;
  const response = await api.get<{ data: any }>(url);

  return {
    id: response.data.data.id,
    type: response.data.data.type,
    attributes: response.data.data.attributes,
  };
};
