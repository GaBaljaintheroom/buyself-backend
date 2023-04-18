import http from 'k6/http';
import { check, sleep } from 'k6';

export let options = {
  vus: 1,
  duration: '1m',

  thresholds: {
    http_req_duration: ['p(99)<1500'], // 99% of requests must complete below 1.5s
  },
};

export default function () {
  let page = Math.floor(Math.random() * 400) + 1;
  let res = http.get(`http://localhost:5000/api/products?page=${page}`);
  check(res, { 'status was 200': (r) => r.status === 200 });
  sleep(1)
}
