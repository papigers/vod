import axios from 'axios';

export const apiAxios = axios.create({
  baseURL: `${window.apiEndpoint}/api`,
  withCredentials: true,
});

export const ldapAxios = axios.create({
  baseURL: `${window.apiEndpoint}/ldap`,
  withCredentials: true,
});

export default apiAxios;
