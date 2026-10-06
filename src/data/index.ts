import { IRepositories } from './repositories/interfaces';
import { mockRepositories } from './adapters/mock/mockAdapter';
import { httpRepositories } from './adapters/http/httpAdapter';

const DATA_SOURCE = import.meta.env.VITE_DATA_SOURCE || 'mock';

export const repositories: IRepositories =
  DATA_SOURCE === 'http' ? httpRepositories : mockRepositories;

export const isUsingMock = DATA_SOURCE !== 'http';
