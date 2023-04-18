import http from "k6/http";

export const options = {
  scenarios: {
    stress: {
      executor: "ramping-arrival-rate",
      preAllocatedVUs: 500,
      timeUnit: "1s",
      stages: [
        { duration: "2m", target: 10 }, // below normal load
        { duration: "5m", target: 10},
        { duration: "2m", target: 20 }, // normal load
        { duration: "5m", target: 20 },
        { duration: "2m", target: 30 }, // around the breaking point
        { duration: "5m", target: 30 },
        { duration: "2m", target: 40 }, // beyond the breaking point
        { duration: "5m", target: 40 },
        { duration: "10m", target: 0 }, // scale down. Recovery stage.
      ],
    },
  },
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
}