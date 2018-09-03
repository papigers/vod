import axios from 'axios';

export const apiAxios = axios.create({
  baseURL: `${process.env.REACT_APP_API_HOSTNAME}/api`,
});

export default apiAxios;
