import http from 'k6/http';
import { check, sleep } from 'k6';

export let options = {
  vus: 3,
  duration: '1m'
};

export default function () {

    let kw = Math.floor(Math.random() * 200) + 100;
    // let page = Math.floor(Math.random() * 30) + 1;
    let res = http.get(`http://localhost:5000/api/search/like?kw=${kw}&page=${1}`);
    check(res, {'status was 200': (r) => r.status === 200});
    sleep(1)
}
