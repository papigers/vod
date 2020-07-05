import axios from 'axios';

export const apiAxios = axios.create({
  baseURL: `${window._env_.REACT_APP_API_HOSTNAME}/api`,
  withCredentials: true,
});

export const ldapAxios = axios.create({
  baseURL: `${window._env_.REACT_APP_API_HOSTNAME}/ldap`,
  withCredentials: true,
});

export default apiAxios;
