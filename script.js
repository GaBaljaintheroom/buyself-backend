import http from 'k6/http';
import { sleep } from 'k6';

export const options = {
  vus: 100,
  duration: '30s',
};

export default function () {
     let page = Math.floor(Math.random() * 400) + 1; //  1부터 400 사이의 랜덤 페이지 생성

    http.get(`http://localhost:5000/api/products?page=${page}`);
    sleep(1); // sleep while a second  /  sleep() 함수를 사용하여 API를 호출하는 각각의 요청을 1초씩 지연
}