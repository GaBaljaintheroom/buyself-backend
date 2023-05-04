import http from 'k6/http';
import { sleep, check } from 'k6';

export const options = {
  stages: [
    { duration: '1m', target: 200 }, // simulate ramp-up of traffic from 1 to 100 users over 5 minutes.
    { duration: '6m', target: 200 }, // stay at 100 users for 10 minutes
    { duration: '1m', target: 0 }, // ramp-down to 0 users
  ],
};

export default function () {
  let page = Math.floor(Math.random() * 400) + 1;
  let res = http.get(`http://localhost:5000/api/products?page=${page}`);

    // Check response status and time
    check(res, {
    'status was 200': (r) => r.status === 200,
    'response time was less than 0.5s': (r) => r.timings.duration <= 500,
    'response time was less than 0.8s': (r) => r.timings.duration <= 800,
    'response time was more than 1.2s': (r) => r.timings.duration >= 1200,
  });

  sleep(1);
}
