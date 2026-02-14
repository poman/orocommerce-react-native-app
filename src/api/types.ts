export interface IRelationshipObject {
  id: string;
  type: string;
}

export interface IJsonApiData<Entity, Relationships = undefined> {
  id: string;
  type: string;
  attributes: Omit<Entity, 'id'>;
  relationships?: Record<
    keyof Relationships,
    { data: IRelationshipObject | IRelationshipObject[] | null }
  >;
}

export interface IJsonApiResponse<Entity, Relationships = undefined> {
  data: IJsonApiData<Entity, Relationships> | Array<IJsonApiData<Entity, Relationships>>;
  included?: Array<IJsonApiData<any, any>>;
  meta?: {
    totalCount?: number;
    [key: string]: any;
  };
  links?: {
    self?: string;
    first?: string;
    last?: string;
    prev?: string;
    next?: string;
  };
}

export interface IJsonApiListResponse<Entity, Relationships = undefined> {
  data: Array<IJsonApiData<Entity, Relationships>>;
  included?: Array<IJsonApiData<any, any>>;
  meta?: {
    totalCount?: number;
    [key: string]: any;
  };
  links?: {
    self?: string;
    first?: string;
    last?: string;
    prev?: string;
    next?: string;
  };
}

export interface IApiError {
  detail: string;
  status: string;
  title: string;
  source?: {
    pointer?: string;
  };
}

export interface IApiErrorResponse {
  errors: IApiError[];
}

export interface IQueryParams {
  page?: {
    number?: number;
    size?: number;
  };
  filter?: Record<string, any>;
  include?: string;
  fields?: Record<string, string>;
  sort?: string;
}
