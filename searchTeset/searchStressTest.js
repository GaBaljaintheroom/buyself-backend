import http from 'k6/http';
import {sleep, check} from 'k6';

export const options = {
  // Key configurations for Stress in this section
  stages: [
    { duration: '2m', target: 400 }, // traffic ramp-up from 1 to a higher 200 users over 10 minutes.
    { duration: '12m', target: 400 }, // stay at higher 200 users for 10 minutes
    { duration: '2m30s', target: 0 }, // ramp-down to 0 users
  ],
};

export default function () {
    let kw = Math.floor(Math.random() * 200) + 100;
    // let page = Math.floor(Math.random() * 30) + 1;
    let res = http.get(`http://localhost:5000/api/search/like?kw=${kw}&page=${1}`);

    // Check response status and time
    check(res, {
    'status was 200': (r) => r.status === 200,
    'response time was less than 0.5s': (r) => r.timings.duration <= 500,
    'response time was less than 0.8s': (r) => r.timings.duration <= 800,
    'response time was more than 1.2s': (r) => r.timings.duration >= 1200,
  });

  sleep(1);
}