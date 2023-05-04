import http from 'k6/http';
import {sleep, check} from 'k6';

export const options = {
  // Key configurations for spike in this section
  stages: [
    { duration: '2m', target: 700 }, // fast ramp-up to a high point
    // No plateau
    { duration: '1m', target: 0 }, // quick ramp-down to 0 users
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
