import request from './request';

const http = {
  /**
   * methods: 请求
   * @param url 请求地址
   * @param params 请求参数
   */
  get(url: string, params: any) {
    const config = {
      method: 'get',
      url,
      params: undefined,
    };
    if (params) config.params = params;
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    return request(config);
  },

  post(url: string, params: any) {
    const config = {
      method: 'post',
      url,
      data: undefined,
    };
    if (params) config.data = params;
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    return request(config);
  },

  put(url: string, params: any) {
    const config = {
      method: 'put',
      url,
      params: undefined,
    };
    if (params) config.params = params;
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    return request(config);
  },

  delete(url: string, params: any) {
    const config = {
      method: 'delete',
      url,
      params: undefined,
    };
    if (params) config.params = params;
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    return request(config);
  },
};

export default http;
