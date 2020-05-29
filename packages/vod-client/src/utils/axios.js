import axios from 'axios';

export const apiAxios = axios.create({
  baseURL: `${window.apiEndpoint}/api`,
  //baseURL: `http://vod-api.army.idf/api`,
  withCredentials: true,
});

export const ldapAxios = axios.create({
  baseURL: `${window.apiEndpoint}/ldap`,
  //baseURL: `http://vod-api.army.idf/ldap`,
  withCredentials: true,
});

export default apiAxios;
