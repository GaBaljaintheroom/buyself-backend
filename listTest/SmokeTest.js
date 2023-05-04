import http from 'k6/http';
import { check, sleep } from 'k6';

export let options = {
  vus: 3,
  duration: '1m'
};

export default function () {
  let page = Math.floor(Math.random() * 400) + 1;
  let res = http.get(`http://localhost:5000/api/products?page=${page}`);
  check(res, {'status was 200': (r) => r.status === 200});
  sleep(1)
}
