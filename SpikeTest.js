import http from "k6/http";
import { check } from 'k6';

export const options = {
  scenarios: {
    spike: {
      executor: "ramping-arrival-rate",
      preAllocatedVUs: 1000,
      timeUnit: "1s",
      stages: [
        { duration: "10s", target: 10 }, // below normal load
        { duration: "1m", target: 10 },
        { duration: "10s", target: 100 }, // spike to 140 iterations
        { duration: "3m", target: 100 }, // stay at 140 for 3 minutes
        { duration: "10s", target: 10 }, // scale down. Recovery stage.
        { duration: "3m", target: 10 },
        { duration: "10s", target: 0 },
      ],
      gracefulStop: "2m",
    },
  },
};



export default function () {
  let page = Math.floor(Math.random() * 400) + 1;
  const BASE_URL = `http://localhost:5000/api/products?page=${page}`
  const responses = http.batch([
    ["GET", `${BASE_URL}`, null],
    ["GET", `${BASE_URL}`, null],
    ["GET", `${BASE_URL}`, null],
    ["GET", `${BASE_URL}`, null],
  ]);

  check(responses[0], {
    'status is 200': (res) => res.status === 200,
  });
}