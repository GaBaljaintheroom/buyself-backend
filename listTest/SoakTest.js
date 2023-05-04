import http from 'k6/http';
import { sleep, check } from 'k6';

export const options = {
  stages: [
    { duration: '2m', target: 400 }, // ramp up to 400 users
    { duration: '1h', target: 400 }, // stay at 400 for ~4 hours
    { duration: '2m', target: 0 }, // scale down. (optional)
  ],
};

export default function () {
  let page = Math.floor(Math.random() * 400) + 1;
  const BASE_URL = `http://localhost:5000/api/products?page=${page}`
  const responses = http.batch([
    ["GET", `${BASE_URL}`],
    ["GET", `${BASE_URL}`],
    ["GET", `${BASE_URL}`],
    ["GET", `${BASE_URL}`],
  ]);

  sleep(1);

  check(responses[0], {
    'status is 200': (res) => res.status === 200,
  });
}